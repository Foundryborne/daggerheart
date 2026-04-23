import { ResourceUpdateMap } from '../../data/action/baseAction.mjs';
import { emitAsGM, GMUpdateEvent, RefreshType, socketEvent } from '../../systemRegistration/socket.mjs';
import Party from '../sheets/actors/party.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class GroupRollDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(party) {
        super();

        this.party = party;
        this.partyMembers = party.system.partyMembers
            .filter(x => Party.DICE_ROLL_ACTOR_TYPES.includes(x.type))
            .map(member => ({
                ...member.toObject(),
                uuid: member.uuid,
                id: member.id,
                selected: true,
                owned: member.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
            }));

        this.leader = null;
        this.openForAllPlayers = true;

        this.tabGroups.application = Object.keys(party.system.groupRoll.participants).length
            ? 'groupRoll'
            : 'initialization';

        Hooks.on(socketEvent.Refresh, this.groupRollRefresh.bind());
    }

    get title() {
        return game.i18n.localize('DAGGERHEART.APPLICATIONS.GroupRollSelect.title');
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        id: 'GroupRollDialog',
        classes: ['daggerheart', 'views', 'dh-style', 'dialog', 'group-roll-dialog'],
        position: { width: 390, height: 'auto' },
        window: {
            icon: 'fa-solid fa-users'
        },
        actions: {
            toggleSelectMember: this.#toggleSelectMember,
            startGroupRoll: this.#startGroupRoll,
            makeRoll: this.#makeRoll,
            removeRoll: this.#removeRoll,
            rerollDice: this.#rerollDice,
            markSuccessful: this.#markSuccessful,
            cancelRoll: this.#onCancelRoll,
            finishRoll: this.#finishRoll
        },
        form: { handler: this.updateData, submitOnChange: true, closeOnSubmit: false }
    };

    static PARTS = {
        initialization: {
            id: 'initialization',
            template: 'systems/daggerheart/templates/dialogs/groupRollDialog/initialization.hbs'
        },
        main: {
            id: 'main',
            template: 'systems/daggerheart/templates/dialogs/groupRollDialog/main.hbs'
        },
        leader: {
            id: 'leader',
            template: 'systems/daggerheart/templates/dialogs/groupRollDialog/parts/member.hbs'
        },
        result: {
            id: 'result',
            template: 'systems/daggerheart/templates/dialogs/groupRollDialog/parts/result.hbs'
        },
        footer: {
            id: 'footer',
            template: 'systems/daggerheart/templates/dialogs/groupRollDialog/parts/footer.hbs'
        }
    };

    /** @inheritdoc */
    static TABS = {
        application: {
            tabs: [{ id: 'initialization' }, { id: 'groupRoll' }]
        }
    };

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        htmlElement
            .querySelector('.main-character-field')
            ?.addEventListener('input', this.updateLeaderField.bind(this));
    }

    _configureRenderParts(options) {
        const parts = super._configureRenderParts(options);
        for (const memberKey of Object.keys(this.party.system.groupRoll.aidingCharacters)) {
            parts[memberKey] = {
                id: memberKey,
                template: 'systems/daggerheart/templates/dialogs/groupRollDialog/parts/member.hbs'
            };
        }
        return parts;
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);

        context.isGM = game.user.isGM;
        context.isEditable = this.getIsEditable();
        context.fields = this.party.system.schema.fields.groupRoll.fields;
        context.data = this.party.system.groupRoll;
        context.traitOptions = CONFIG.DH.ACTOR.abilities;
        context.members = {};
        context.aidKeys = Object.keys(this.party.system.groupRoll.aidingCharacters);
        context.allHaveRolled = Object.keys(context.data.participants).every(key => {
            const data = context.data.participants[key];
            return Boolean(data.rollData);
        });

        return context;
    }

    async _preparePartContext(partId, context, options) {
        const partContext = await super._preparePartContext(partId, context, options);
        partContext.partId = partId;
        partContext.leader = this.getRollCharacterData(this.party.system.groupRoll.leader);

        switch (partId) {
            case 'initialization':
                partContext.groupRollFields = this.party.system.schema.fields.groupRoll.fields;
                partContext.memberSelection = this.partyMembers;

                const selectedMembers = partContext.memberSelection.filter(x => x.selected);

                partContext.selectedLeader = this.leader;
                partContext.selectedLeaderOptions = selectedMembers
                    .filter(actor => actor.owned)
                    .map(x => ({ value: x.id, label: x.name }));
                partContext.selectedLeaderDisabled = !selectedMembers.length;

                partContext.canStartGroupRoll = selectedMembers.length > 1 && this.leader?.memberId;
                partContext.openForAllPlayers = this.openForAllPlayers;
                break;
            case 'result':
                const leader = this.party.system.groupRoll.leader;
                partContext.hasRolled =
                    leader?.rollData ||
                    Object.values(this.party.system.groupRoll?.aidingCharacters ?? {}).some(x => x.successful !== null);
                const { modifierTotal, modifiers } = Object.values(this.party.system.groupRoll.aidingCharacters).reduce(
                    (acc, curr) => {
                        const modifier = curr.successful === true ? 1 : curr.successful === false ? -1 : null;
                        if (modifier) {
                            acc.modifierTotal += modifier;
                            acc.modifiers.push(modifier);
                        }

                        return acc;
                    },
                    { modifierTotal: 0, modifiers: [] }
                );
                const leaderTotal = leader?.rollData ? leader.roll.total : null;
                partContext.groupRoll = {
                    totalLabel: leader?.rollData
                        ? game.i18n.format('DAGGERHEART.GENERAL.withThing', {
                              thing: leader.roll.totalLabel
                          })
                        : null,
                    totalDualityClass: leader?.roll?.isCritical ? 'critical' : leader?.roll?.withHope ? 'hope' : 'fear',
                    total: leaderTotal + modifierTotal,
                    leaderTotal: leaderTotal,
                    modifiers
                };
                break;
            case 'footer':
                partContext.canFinishRoll =
                    Boolean(this.party.system.groupRoll.leader?.rollData) &&
                    Object.values(this.party.system.groupRoll.aidingCharacters).every(x => x.successful !== null);
                break;
        }

        if (Object.keys(this.party.system.groupRoll.aidingCharacters).includes(partId)) {
            const characterData = this.party.system.groupRoll.aidingCharacters[partId];
            partContext.members[partId] = this.getRollCharacterData(characterData, partId);
        }

        return partContext;
    }

    getRollCharacterData(data, partId) {
        if (!data) return {};

        const actor = game.actors.get(data.id);
        const isLeader = data === this.party.system.groupRoll.leader;

        const roll = data.roll;
        const withTypeSuffix = !roll ? null : roll.isCritical ? 'criticalShort' : roll.withHope ? 'hope' : 'fear';
        const thing = withTypeSuffix ? _loc(`DAGGERHEART.GENERAL.${withTypeSuffix}`) : null;

        return {
            ...data,
            type: isLeader ? 'leader' : 'aid',
            basePath: isLeader ? 'system.groupRoll.leader' : `system.groupRoll.aidingCharacters.${data.id}`,
            rollChoiceLabel: _loc(CONFIG.DH.ACTOR.abilities[data.rollChoice]?.label),
            roll: data.roll,
            isEditable: actor?.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER),
            key: partId,
            readyToRoll: Boolean(data.rollChoice),
            hasRolled: Boolean(data.rollData),
            modifier: data.successful ? 1 : data.successful === false ? -1 : 0,
            withLabelShort: thing ? _loc('DAGGERHEART.GENERAL.withThing', { thing }) : null
        };
    }

    #getCharacterDataById(id) {
        if (!id) return null;

        const groupRoll = this.party.system.groupRoll;
        if (id === 'leader' || id === groupRoll.leader?.id) {
            return { data: groupRoll.leader, basePath: 'system.groupRoll.leader' };
        } else if (id in groupRoll.aidingCharacters) {
            return { data: groupRoll.aidingCharacters[id], basePath: `system.groupRoll.aidingCharacters.${id}` };
        }

        return null;
    }

    static async updateData(event, _, formData) {
        const partyData = foundry.utils.expandObject(formData.object);
        this.updatePartyData(partyData, this.getUpdatingParts(event.target));
    }

    async updatePartyData(update, updatingParts, options = { render: true }) {
        if (!game.users.activeGM)
            return ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.gmRequired'));

        const gmUpdate = async update => {
            await this.party.update(update);
            this.render({ parts: updatingParts });
            game.socket.emit(`system.${CONFIG.DH.id}`, {
                action: socketEvent.Refresh,
                data: { refreshType: RefreshType.GroupRoll, action: 'refresh', parts: updatingParts }
            });
        };

        await emitAsGM(
            GMUpdateEvent.UpdateDocument,
            gmUpdate,
            update,
            this.party.uuid,
            options.render ? { refreshType: RefreshType.GroupRoll, action: 'refresh', parts: updatingParts } : undefined
        );
    }

    getUpdatingParts(target) {
        const { initialization, leader, result, footer } = this.constructor.PARTS;
        const isInitialization = this.tabGroups.application === initialization.id;
        const updatingMember = target.closest('.member-roll-container.aid')?.dataset?.memberKey;
        const updatingLeader = target.closest('.member-roll-container.leader');

        return [
            ...(isInitialization ? [initialization.id] : []),
            ...(updatingMember ? [updatingMember] : []),
            ...(updatingLeader ? [leader.id] : []),
            ...(!isInitialization ? [result.id, footer.id] : [])
        ];
    }

    getIsEditable() {
        return this.party.system.partyMembers.some(actor => {
            const selected = Boolean(this.party.system.groupRoll.participants[actor.id]);
            return selected && actor.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER);
        });
    }

    groupRollRefresh = ({ refreshType, action, parts }) => {
        if (refreshType !== RefreshType.GroupRoll) return;

        switch (action) {
            case 'startGroupRoll':
                this.tabGroups.application = 'groupRoll';
                break;
            case 'refresh':
                this.render({ parts });
                break;
            case 'close':
                this.close();
                break;
        }
    };

    async close(options = {}) {
        /* Opt out of Foundry's standard behavior of closing all application windows marked as UI when Escape is pressed */
        if (options.closeKey) return;

        Hooks.off(socketEvent.Refresh, this.groupRollRefresh);
        return super.close(options);
    }

    //#region Initialization
    static #toggleSelectMember(_, button) {
        const member = this.partyMembers.find(x => x.id === button.dataset.id);
        member.selected = !member.selected;
        if (this.leader?.memberId === member.id) {
            this.leader = null;
        }
        this.render();
    }

    updateLeaderField(event) {
        if (!this.leader) this.leader = {};
        this.leader.memberId = event.target.value;
        this.render();
    }

    static async #startGroupRoll() {
        const leader = this.partyMembers.find(x => x.id === this.leader.memberId);
        const aidingCharacters = this.partyMembers.reduce((acc, curr) => {
            if (curr.selected && curr.id !== this.leader.memberId)
                acc[curr.id] = { id: curr.id, name: curr.name, img: curr.img };

            return acc;
        }, {});

        await this.party.update({
            'system.groupRoll': _replace(
                new game.system.api.data.GroupRollData({
                    ...this.party.system.groupRoll.toObject(),
                    leader: { id: leader.id, name: leader.name, img: leader.img },
                    aidingCharacters
                })
            )
        });

        const hookData = { openForAllPlayers: this.openForAllPlayers, partyId: this.party.id };
        Hooks.callAll(CONFIG.DH.HOOKS.hooksConfig.groupRollStart, hookData);
        game.socket.emit(`system.${CONFIG.DH.id}`, {
            action: socketEvent.GroupRollStart,
            data: hookData
        });

        this.render();
    }
    //#endregion

    /** @this GroupRollDialog */
    static async #makeRoll(_event, button) {
        const member = button.closest('[data-member-key]').dataset.memberKey;
        const { data, basePath } = this.#getCharacterDataById(member);
        const actor = game.actors.find(x => x.id === data.id);
        if (!actor) return;

        const result = await actor.rollTrait(data.rollChoice, {
            skips: {
                createMessage: true,
                resources: true,
                triggers: true
            }
        });

        if (!result) return;
        // todo: move logic to actor.rollTrait() or actor.diceRoll()
        if (!game.modules.get('dice-so-nice')?.active) foundry.audio.AudioHelper.play({ src: CONFIG.sounds.dice });

        const rollData = result.messageRoll.toJSON();
        delete rollData.options.messageRoll;
        this.updatePartyData(
            {
                [basePath]: { rollData, successful: null }
            },
            this.getUpdatingParts(button)
        );
    }

    /** @this GroupRollDialog  */
    static async #removeRoll(_event, button) {
        const member = button.closest('[data-member-key]').dataset.memberKey;
        const { basePath } = this.#getCharacterDataById(member);
        this.updatePartyData(
            {
                [basePath]: {
                    rollData: null,
                    rollChoice: null,
                    selected: false,
                    successful: null
                }
            },
            this.getUpdatingParts(button)
        );
    }

    /** @this GroupRollDialog */
    static async #rerollDice(_, button) {
        const { diceType } = button.dataset;
        const { data, basePath } = this.#getCharacterDataById(button.dataset.member);

        const dieIndex = diceType === 'hope' ? 0 : diceType === 'fear' ? 1 : 2;
        const newRoll = game.system.api.dice.DualityRoll.fromData(data.rollData);
        const dice = newRoll.dice[dieIndex];
        await dice.reroll(`/r1=${dice.total}`, {
            liveRoll: {
                roll: newRoll,
                isReaction: true
            }
        });
        const rollData = newRoll.toJSON();
        this.updatePartyData(
            {
                [`${basePath}.rollData`]: rollData
            },
            this.getUpdatingParts(button)
        );
    }

    static #markSuccessful(_event, button) {
        const memberKey = button.closest('[data-member-key]').dataset.memberKey;
        const previousValue = this.party.system.groupRoll.aidingCharacters[memberKey].successful;
        const newValue = Boolean(button.dataset.success === 'true');
        this.updatePartyData(
            {
                [`system.groupRoll.aidingCharacters.${memberKey}.successful`]:
                    previousValue === newValue ? null : newValue
            },
            this.getUpdatingParts(button)
        );
    }

    static async #onCancelRoll(_event, _button, options = { confirm: true }) {
        this.cancelRoll(options);
    }

    async cancelRoll(options = { confirm: true }) {
        if (options.confirm) {
            const confirmed = await foundry.applications.api.DialogV2.confirm({
                window: {
                    title: game.i18n.localize('DAGGERHEART.APPLICATIONS.GroupRollSelect.cancelConfirmTitle')
                },
                content: game.i18n.localize('DAGGERHEART.APPLICATIONS.GroupRollSelect.cancelConfirmText')
            });

            if (!confirmed) return;
        }

        await this.updatePartyData(
            {
                'system.groupRoll': {
                    leader: null,
                    aidingCharacters: _replace({})
                }
            },
            [],
            { render: false }
        );

        this.close();
        game.socket.emit(`system.${CONFIG.DH.id}`, {
            action: socketEvent.Refresh,
            data: { refreshType: RefreshType.GroupRoll, action: 'close' }
        });
    }

    static async #finishRoll() {
        const totalRoll = this.party.system.groupRoll.leader.roll;
        for (const character of Object.values(this.party.system.groupRoll.aidingCharacters)) {
            totalRoll.terms.push(new foundry.dice.terms.OperatorTerm({ operator: character.successful ? '+' : '-' }));
            totalRoll.terms.push(new foundry.dice.terms.NumericTerm({ number: 1 }));
        }

        await totalRoll._evaluate();

        const systemData = totalRoll.options;
        const actor = game.actors.get(this.party.system.groupRoll.leader.id);

        const cls = getDocumentClass('ChatMessage'),
            msgData = {
                type: 'dualityRoll',
                user: game.user.id,
                title: game.i18n.localize('DAGGERHEART.APPLICATIONS.GroupRollSelect.title'),
                speaker: cls.getSpeaker({ actor }),
                system: systemData,
                rolls: [JSON.stringify(totalRoll)],
                sound: null,
                flags: { core: { RollTable: true } }
            };

        await cls.create(msgData);

        const resourceMap = new ResourceUpdateMap(actor);
        if (totalRoll.isCritical) {
            resourceMap.addResources([
                { key: 'stress', value: -1, total: 1 },
                { key: 'hope', value: 1, total: 1 }
            ]);
        } else if (totalRoll.withHope) {
            resourceMap.addResources([{ key: 'hope', value: 1, total: 1 }]);
        } else {
            resourceMap.addResources([{ key: 'fear', value: 1, total: 1 }]);
        }

        resourceMap.updateResources();

        /* Fin */
        this.cancelRoll({ confirm: false });
    }
}
