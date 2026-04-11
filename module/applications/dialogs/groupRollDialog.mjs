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
        position: { width: 550, height: 'auto' },
        actions: {
            toggleSelectMember: this.#toggleSelectMember,
            startGroupRoll: this.#startGroupRoll,
            makeRoll: this.#makeRoll,
            removeRoll: this.#removeRoll,
            rerollDice: this.#rerollDice,
            makeLeaderRoll: this.#makeLeaderRoll,
            removeLeaderRoll: this.#removeLeaderRoll,
            rerollLeaderDice: this.#rerollLeaderDice,
            markSuccessfull: this.#markSuccessfull,
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
        leader: {
            id: 'leader',
            template: 'systems/daggerheart/templates/dialogs/groupRollDialog/leader.hbs'
        },
        groupRoll: {
            id: 'groupRoll',
            template: 'systems/daggerheart/templates/dialogs/groupRollDialog/groupRoll.hbs'
        },
        footer: {
            id: 'footer',
            template: 'systems/daggerheart/templates/dialogs/groupRollDialog/footer.hbs'
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
        const { initialization, leader, groupRoll, footer } = super._configureRenderParts(options);
        const augmentedParts = { initialization };
        for (const memberKey of Object.keys(this.party.system.groupRoll.aidingCharacters)) {
            augmentedParts[memberKey] = {
                id: memberKey,
                template: 'systems/daggerheart/templates/dialogs/groupRollDialog/groupRollMember.hbs'
            };
        }

        augmentedParts.leader = leader;
        augmentedParts.groupRoll = groupRoll;
        augmentedParts.footer = footer;

        return augmentedParts;
    }

    /**@inheritdoc */
    async _onRender(context, options) {
        await super._onRender(context, options);

        if (this.element.querySelector('.team-container')) return;

        if (this.tabGroups.application !== this.constructor.PARTS.initialization.id) {
            const initializationPart = this.element.querySelector('.initialization-container');
            initializationPart.insertAdjacentHTML('afterend', '<div class="team-container"></div>');
            initializationPart.insertAdjacentHTML(
                'afterend',
                `<div class="section-title">${game.i18n.localize('Aiding Characters')}</div>`
            );

            const teamContainer = this.element.querySelector('.team-container');
            for (const memberContainer of this.element.querySelectorAll('.team-member-container'))
                teamContainer.appendChild(memberContainer);
        }
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);

        context.isGM = game.user.isGM;
        context.isEditable = this.getIsEditable();
        context.fields = this.party.system.schema.fields.groupRoll.fields;
        context.data = this.party.system.groupRoll;
        context.traitOptions = CONFIG.DH.ACTOR.abilities;
        context.members = {};
        context.allHaveRolled = Object.keys(context.data.participants).every(key => {
            const data = context.data.participants[key];
            return Boolean(data.rollData);
        });

        return context;
    }

    async _preparePartContext(partId, context, options) {
        const partContext = await super._preparePartContext(partId, context, options);
        partContext.partId = partId;

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
            case 'leader':
                partContext.leader = this.getRollCharacterData(this.party.system.groupRoll.leader);
                break;
            case 'groupRoll':
                const leader = this.party.system.groupRoll.leader;
                partContext.hasRolled =
                    leader?.rollData ||
                    Object.values(this.party.system.groupRoll?.aidingCharacters ?? {}).some(
                        x => x.successfull !== null
                    );
                const { modifierTotal, modifiers } = Object.values(this.party.system.groupRoll.aidingCharacters).reduce(
                    (acc, curr) => {
                        const modifier = curr.successfull === true ? 1 : curr.successfull === false ? -1 : null;
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
                    Object.values(this.party.system.groupRoll.aidingCharacters).every(x => x.successfull !== null);
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

        return {
            ...data,
            roll: data.roll,
            isEditable: actor.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER),
            key: partId,
            readyToRoll: Boolean(data.rollChoice),
            hasRolled: Boolean(data.rollData)
        };
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
        const { initialization, leader, groupRoll, footer } = this.constructor.PARTS;
        const isInitialization = this.tabGroups.application === initialization.id;
        const updatingMember = target.closest('.team-member-container')?.dataset?.memberKey;
        const updatingLeader = target.closest('.main-character-outer-container');

        return [
            ...(isInitialization ? [initialization.id] : []),
            ...(updatingMember ? [updatingMember] : []),
            ...(updatingLeader ? [leader.id] : []),
            ...(!isInitialization ? [groupRoll.id, footer.id] : [])
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

    async makeRoll(button, characterData, path) {
        const actor = game.actors.find(x => x.id === characterData.id);
        if (!actor) return;

        const result = await actor.rollTrait(characterData.rollChoice, {
            skips: {
                createMessage: true,
                resources: true,
                triggers: true
            }
        });

        if (!result) return;
        if (!game.modules.get('dice-so-nice')?.active) foundry.audio.AudioHelper.play({ src: CONFIG.sounds.dice });

        const rollData = result.messageRoll.toJSON();
        delete rollData.options.messageRoll;
        this.updatePartyData(
            {
                [path]: rollData
            },
            this.getUpdatingParts(button)
        );
    }

    static async #makeRoll(_event, button) {
        const { member } = button.dataset;
        const character = this.party.system.groupRoll.aidingCharacters[member];
        this.makeRoll(button, character, `system.groupRoll.aidingCharacters.${member}.rollData`);
    }

    static async #makeLeaderRoll(_event, button) {
        const character = this.party.system.groupRoll.leader;
        this.makeRoll(button, character, 'system.groupRoll.leader.rollData');
    }

    async removeRoll(button, path) {
        this.updatePartyData(
            {
                [path]: {
                    rollData: null,
                    rollChoice: null,
                    selected: false,
                    successfull: null
                }
            },
            this.getUpdatingParts(button)
        );
    }

    static async #removeRoll(_event, button) {
        this.removeRoll(button, `system.groupRoll.aidingCharacters.${button.dataset.member}`);
    }

    static async #removeLeaderRoll(_event, button) {
        this.removeRoll(button, 'system.groupRoll.leader');
    }

    async rerollDice(button, data, path) {
        const { diceType } = button.dataset;

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
                [path]: rollData
            },
            this.getUpdatingParts(button)
        );
    }

    static async #rerollDice(_, button) {
        const { member } = button.dataset;
        this.rerollDice(
            button,
            this.party.system.groupRoll.aidingCharacters[member],
            `system.groupRoll.aidingCharacters.${member}.rollData`
        );
    }

    static async #rerollLeaderDice(_, button) {
        this.rerollDice(button, this.party.system.groupRoll.leader, `system.groupRoll.leader.rollData`);
    }

    static #markSuccessfull(_event, button) {
        const previousValue = this.party.system.groupRoll.aidingCharacters[button.dataset.member].successfull;
        const newValue = Boolean(button.dataset.successfull === 'true');
        this.updatePartyData(
            {
                [`system.groupRoll.aidingCharacters.${button.dataset.member}.successfull`]:
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
            totalRoll.terms.push(new foundry.dice.terms.OperatorTerm({ operator: character.successfull ? '+' : '-' }));
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
