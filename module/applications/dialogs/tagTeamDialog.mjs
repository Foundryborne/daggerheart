import { MemberData } from '../../data/tagTeamData.mjs';
import { getCritDamageBonus } from '../../helpers/utils.mjs';
import { emitAsGM, GMUpdateEvent, RefreshType, socketEvent } from '../../systemRegistration/socket.mjs';
import Party from '../sheets/actors/party.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class TagTeamDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(party) {
        super();

        this.party = party;
        this.partyMembers = party.system.partyMembers
            .filter(x => Party.DICE_ROLL_ACTOR_TYPES.includes(x.type))
            .map(member => ({
                ...member.toObject(),
                uuid: member.uuid,
                id: member.id,
                selected: false,
                owned: member.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
            }));

        this.initiator = null;
        this.openForAllPlayers = true;

        this.tabGroups.application = Object.keys(party.system.tagTeam.members).length
            ? 'tagTeamRoll'
            : 'initialization';

        Hooks.on(socketEvent.Refresh, this.tagTeamRefresh.bind());
    }

    get title() {
        return game.i18n.localize('DAGGERHEART.APPLICATIONS.TagTeamSelect.title');
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        id: 'TagTeamDialog',
        classes: ['daggerheart', 'views', 'dh-style', 'dialog', 'tag-team-dialog'],
        position: { width: 550, height: 'auto' },
        actions: {
            toggleSelectMember: TagTeamDialog.#toggleSelectMember,
            startTagTeamRoll: TagTeamDialog.#startTagTeamRoll,
            makeRoll: TagTeamDialog.#makeRoll,
            removeRoll: TagTeamDialog.#removeRoll,
            rerollDice: TagTeamDialog.#rerollDice,
            makeDamageRoll: TagTeamDialog.#makeDamageRoll,
            removeDamageRoll: TagTeamDialog.#removeDamageRoll,
            rerollDamageDice: TagTeamDialog.#rerollDamageDice,
            selectRoll: TagTeamDialog.#selectRoll,
            cancelRoll: TagTeamDialog.#onCancelRoll,
            finishRoll: TagTeamDialog.#finishRoll
        },
        form: { handler: this.updateData, submitOnChange: true, closeOnSubmit: false }
    };

    static PARTS = {
        initialization: {
            id: 'initialization',
            template: 'systems/daggerheart/templates/dialogs/tagTeamDialog/initialization.hbs'
        },
        rollSelection: {
            id: 'rollSelection',
            template: 'systems/daggerheart/templates/dialogs/tagTeamDialog/rollSelection.hbs'
        },
        tagTeamRoll: {
            id: 'tagTeamRoll',
            template: 'systems/daggerheart/templates/dialogs/tagTeamDialog/tagTeamRoll.hbs'
        }
    };

    /** @inheritdoc */
    static TABS = {
        application: {
            tabs: [{ id: 'initialization' }, { id: 'tagTeamRoll' }]
        }
    };

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        for (const element of htmlElement.querySelectorAll('.roll-type-select'))
            element.addEventListener('change', this.updateRollType.bind(this));

        htmlElement
            .querySelector('.initiator-member-field')
            ?.addEventListener('input', this.updateInitiatorMemberField.bind(this));

        htmlElement
            .querySelector('.initiator-cost-field')
            ?.addEventListener('input', this.updateInitiatorCostField.bind(this));

        htmlElement
            .querySelector('.openforall-field')
            ?.addEventListener('change', this.updateOpenForAllField.bind(this));
    }

    _configureRenderParts(options) {
        const { initialization, rollSelection, tagTeamRoll } = super._configureRenderParts(options);
        const augmentedParts = { initialization };
        for (const memberKey of Object.keys(this.party.system.tagTeam.members)) {
            augmentedParts[memberKey] = {
                id: memberKey,
                template: 'systems/daggerheart/templates/dialogs/tagTeamDialog/tagTeamMember.hbs'
            };
        }
        augmentedParts.rollSelection = rollSelection;
        augmentedParts.tagTeamRoll = tagTeamRoll;

        return augmentedParts;
    }

    /**@inheritdoc */
    async _onRender(context, options) {
        await super._onRender(context, options);

        if (this.element.querySelector('.team-container')) return;
        const initializationPart = this.element.querySelector('.initialization-container');
        initializationPart.insertAdjacentHTML('afterend', '<div class="team-container"></div>');
        const teamContainer = this.element.querySelector('.team-container');
        for (const memberContainer of this.element.querySelectorAll('.team-member-container'))
            teamContainer.appendChild(memberContainer);
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.isEditable = this.getIsEditable();
        context.fields = this.party.system.schema.fields.tagTeam.fields;
        context.data = this.party.system.tagTeam;
        context.rollTypes = CONFIG.DH.GENERAL.tagTeamRollTypes;
        context.traitOptions = CONFIG.DH.ACTOR.abilities;
        context.members = {};
        context.allHaveRolled = Object.keys(this.party.system.tagTeam.members).every(key => {
            const data = this.party.system.tagTeam.members[key];
            return Boolean(data.rollData);
        });

        return context;
    }

    async _preparePartContext(partId, context, options) {
        const partContext = await super._preparePartContext(partId, context, options);
        partContext.partId = partId;
        switch (partId) {
            case 'initialization':
                partContext.tagTeamFields = this.party.system.schema.fields.tagTeam.fields;
                partContext.memberSelection = this.partyMembers;
                const selectedMembers = partContext.memberSelection.filter(x => x.selected);

                partContext.allSelected = selectedMembers.length === 2;
                partContext.canStartTagTeam =
                    partContext.allSelected && this.initiator?.memberId && typeof this.initiator?.cost === 'number';
                partContext.initiator = this.initiator;
                partContext.initiatorOptions = selectedMembers
                    .filter(actor => actor.owned)
                    .map(x => ({ value: x.id, label: x.name }));
                partContext.initiatorDisabled = !selectedMembers.length;
                partContext.openForAllPlayers = this.openForAllPlayers;

                break;
            case 'rollSelection':
                partContext.members = Object.keys(this.party.system.tagTeam.members).reduce((acc, key) => {
                    const member = this.party.system.tagTeam.members[key];
                    acc[key] = { selected: member.selected };
                    return acc;
                }, {});
                break;
            case 'tagTeamRoll':
                const selectedRoll = Object.values(this.party.system.tagTeam.members).find(member => member.selected);
                const critSelected = !selectedRoll
                    ? undefined
                    : (selectedRoll?.rollData?.options?.roll?.isCritical ?? false);

                partContext.hintText = await this.getInfoTexts(this.party.system.tagTeam.members);
                partContext.joinedRoll = await this.getJoinedRoll({
                    overrideIsCritical: critSelected,
                    displayVersion: true
                });

                break;
        }

        if (Object.keys(this.party.system.tagTeam.members).includes(partId)) {
            const data = this.party.system.tagTeam.members[partId];
            const actor = game.actors.get(partId);

            const rollOptions = [];
            const damageRollOptions = [];
            for (const item of actor.items) {
                if (item.system.metadata.hasActions) {
                    const actions = [...item.system.actions, ...(item.system.attack ? [item.system.attack] : [])];
                    for (const action of actions) {
                        if (action.hasRoll) {
                            const actionItem = {
                                value: action.uuid,
                                label: action.name,
                                group: item.name,
                                baseAction: action.baseAction
                            };

                            if (action.hasDamage) damageRollOptions.push(actionItem);
                            else rollOptions.push(actionItem);
                        }
                    }
                }
            }

            const selectedRoll = Object.values(this.party.system.tagTeam.members).find(member => member.selected);
            const critSelected = !selectedRoll
                ? undefined
                : (selectedRoll?.rollData?.options?.roll?.isCritical ?? false);

            const damage = data.rollData?.options?.damage;
            partContext.hasDamage |= Boolean(damage);
            const critHitPointsDamage = await this.getCriticalDamage(damage);

            partContext.members[partId] = {
                ...data,
                roll: data.roll,
                isEditable: actor.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER),
                key: partId,
                readyToRoll: Boolean(data.rollChoice),
                hasRolled: Boolean(data.rollData),
                rollOptions,
                damageRollOptions,
                damage: damage,
                critDamage: critHitPointsDamage,
                useCritDamage: critSelected || (critSelected === undefined && data.rollData?.options?.roll?.isCritical)
            };
        }

        return partContext;
    }

    getUpdatingParts(target) {
        const { initialization, rollSelection, tagTeamRoll } = this.constructor.PARTS;
        const isInitialization = this.tabGroups.application === initialization.id;
        const updatingMember = target.closest('.team-member-container')?.dataset?.memberKey;

        return [
            ...(isInitialization ? [initialization.id] : []),
            ...(updatingMember ? [updatingMember] : []),
            ...(!isInitialization ? [rollSelection.id] : []),
            ...(!isInitialization ? [tagTeamRoll.id] : [])
        ];
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
                data: { refreshType: RefreshType.TagTeamRoll, action: 'refresh', parts: updatingParts }
            });
        };

        await emitAsGM(
            GMUpdateEvent.UpdateDocument,
            gmUpdate,
            update,
            this.party.uuid,
            options.render
                ? { refreshType: RefreshType.TagTeamRoll, action: 'refresh', parts: updatingParts }
                : undefined
        );
    }

    getIsEditable() {
        return this.party.system.partyMembers.some(actor => {
            const selected = Boolean(this.party.system.tagTeam.members[actor.id]);
            return selected && actor.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER);
        });
    }

    tagTeamRefresh = ({ refreshType, action, parts }) => {
        if (refreshType !== RefreshType.TagTeamRoll) return;

        switch (action) {
            case 'startTagTeamRoll':
                this.tabGroups.application = 'tagTeamRoll';
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

        Hooks.off(socketEvent.Refresh, this.tagTeamRefresh);
        return super.close(options);
    }

    checkInitiatorHopeError(initiator) {
        if (initiator.cost && initiator.memberId) {
            const actor = game.actors.get(initiator.memberId);
            if (actor.system.resources.hope.value < initiator.cost) {
                return ui.notifications.warn(
                    game.i18n.localize('DAGGERHEART.APPLICATIONS.TagTeamSelect.insufficientHope')
                );
            }
        }
    }

    //#region Initialization
    static #toggleSelectMember(_, button) {
        const member = this.partyMembers.find(x => x.id === button.dataset.id);
        if (member.selected && this.initiator?.memberId === member.id) this.initiator = null;

        member.selected = !member.selected;
        this.render();
    }

    static async #startTagTeamRoll() {
        const error = this.checkInitiatorHopeError(this.initiator);
        if (error) return error;

        await this.party.update({
            'system.tagTeam': _replace(
                new game.system.api.data.TagTeamData({
                    ...this.party.system.tagTeam.toObject(),
                    initiator: this.initiator,
                    members: this.partyMembers.reduce((acc, member) => {
                        if (member.selected)
                            acc[member.id] = {
                                name: member.name,
                                img: member.img,
                                rollType: CONFIG.DH.GENERAL.tagTeamRollTypes.trait.id
                            };
                        return acc;
                    }, {})
                })
            )
        });

        const hookData = { openForAllPlayers: this.openForAllPlayers, partyId: this.party.id };
        Hooks.callAll(CONFIG.DH.HOOKS.hooksConfig.tagTeamStart, hookData);
        game.socket.emit(`system.${CONFIG.DH.id}`, {
            action: socketEvent.TagTeamStart,
            data: hookData
        });

        this.render();
    }
    //#endregion
    //#region Tag Team Roll

    async getInfoTexts(members) {
        let rollsAreFinished = true;
        let rollIsSelected = false;
        for (const member of Object.values(members)) {
            const rollFinished = Boolean(member.rollData);
            const damageFinished =
                member.rollData?.options?.hasDamage !== undefined ? member.rollData.options.damage : true;

            rollsAreFinished = rollsAreFinished && rollFinished && damageFinished;
            rollIsSelected = rollIsSelected || member.selected;
        }

        let hint = null;
        if (!rollsAreFinished) hint = game.i18n.localize('DAGGERHEART.APPLICATIONS.TagTeamSelect.hints.completeRolls');
        else if (!rollIsSelected) hint = game.i18n.localize('DAGGERHEART.APPLICATIONS.TagTeamSelect.hints.selectRoll');

        return hint;
    }

    async updateRollType(event) {
        this.updatePartyData(
            {
                [`system.tagTeam.members.${event.target.dataset.member}`]: {
                    rollType: event.target.value,
                    rollChoice: null
                }
            },
            this.getUpdatingParts(event.target)
        );
    }

    updateInitiatorMemberField(event) {
        if (!this.initiator) this.initiator = {};
        this.initiator.memberId = event.target.value;
        this.render();
    }

    updateInitiatorCostField(event) {
        if (!this.initiator) this.initiator = {};
        this.initiator.cost = event.target.value ? Number.parseInt(event.target.value) : null;
        this.render();
    }

    updateOpenForAllField(event) {
        this.openForAllPlayers = event.target.checked;
        this.render();
    }

    static async #removeRoll(_, button) {
        this.updatePartyData(
            {
                [`system.tagTeam.members.${button.dataset.member}`]: {
                    rollData: null,
                    rollChoice: null,
                    selected: false
                }
            },
            this.getUpdatingParts(button)
        );
    }

    static async #makeRoll(event, button) {
        const { member } = button.dataset;

        let result = null;
        switch (this.party.system.tagTeam.members[member].rollType) {
            case CONFIG.DH.GENERAL.tagTeamRollTypes.trait.id:
                result = await this.makeTraitRoll(member);
                break;
            case CONFIG.DH.GENERAL.tagTeamRollTypes.ability.id:
            case CONFIG.DH.GENERAL.tagTeamRollTypes.damageAbility.id:
                result = await this.makeAbilityRoll(event, member);
                break;
        }

        if (!result) return;

        if (!game.modules.get('dice-so-nice')?.active) foundry.audio.AudioHelper.play({ src: CONFIG.sounds.dice });

        const rollData = result.messageRoll.toJSON();
        delete rollData.options.messageRoll;
        this.updatePartyData(
            {
                [`system.tagTeam.members.${member}.rollData`]: rollData
            },
            this.getUpdatingParts(button)
        );
    }

    async makeTraitRoll(memberKey) {
        const actor = game.actors.find(x => x.id === memberKey);
        if (!actor) return;

        const memberData = this.party.system.tagTeam.members[memberKey];
        return await actor.rollTrait(memberData.rollChoice, {
            skips: {
                createMessage: true,
                resources: true,
                triggers: true
            }
        });
    }

    async makeAbilityRoll(event, memberKey) {
        const actor = game.actors.find(x => x.id === memberKey);
        if (!actor) return;

        const memberData = this.party.system.tagTeam.members[memberKey];
        const action = await foundry.utils.fromUuid(memberData.rollChoice);

        return await action.use(event, {
            skips: {
                createMessage: true,
                resources: true,
                triggers: true
            }
        });
    }

    static async #rerollDice(_, button) {
        const { member, diceType } = button.dataset;
        const memberData = this.party.system.tagTeam.members[member];

        const dieIndex = diceType === 'hope' ? 0 : diceType === 'fear' ? 1 : 2;
        const newRoll = game.system.api.dice.DualityRoll.fromData(memberData.rollData);
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
                [`system.tagTeam.members.${member}.rollData`]: rollData
            },
            this.getUpdatingParts(button)
        );
    }

    static async #makeDamageRoll(event, button) {
        const { memberKey } = button.dataset;
        const actor = game.actors.find(x => x.id === memberKey);
        if (!actor) return;

        const memberData = this.party.system.tagTeam.members[memberKey];
        const action = await foundry.utils.fromUuid(memberData.rollChoice);
        const config = {
            ...memberData.rollData.options,
            dialog: {
                configure: !event.shiftKey
            },
            skips: {
                createMessage: true,
                resources: true,
                triggers: true
            }
        };

        await action.workflow.get('damage').execute(config, null, true);
        if (!config.damage) return;

        const current = this.party.system.tagTeam.members[memberKey].rollData;
        await this.updatePartyData(
            {
                [`system.tagTeam.members.${memberKey}.rollData`]: {
                    ...current,
                    options: {
                        ...current.options,
                        damage: config.damage
                    }
                }
            },
            this.getUpdatingParts(button)
        );
    }

    static async #removeDamageRoll(_, button) {
        const { memberKey } = button.dataset;
        const current = this.party.system.tagTeam.members[memberKey].rollData;
        this.updatePartyData(
            {
                [`system.tagTeam.members.${memberKey}.rollData`]: {
                    ...current,
                    options: {
                        ...current.options,
                        damage: null
                    }
                }
            },
            this.getUpdatingParts(button)
        );
    }

    static async #rerollDamageDice(_, button) {
        const { memberKey, damageKey, part, dice } = button.dataset;
        const memberData = this.party.system.tagTeam.members[memberKey];
        const partData = memberData.rollData.options.damage[damageKey].parts[part];
        const activeDiceResultKey = Object.keys(partData.dice[dice].results).find(
            index => partData.dice[dice].results[index].active
        );
        const { parsedRoll, rerolledDice } = await game.system.api.dice.DamageRoll.reroll(
            partData,
            dice,
            activeDiceResultKey
        );

        const rollData = this.party.system.tagTeam.members[memberKey].rollData;
        rollData.options.damage[damageKey].parts = rollData.options.damage[damageKey].parts.map((damagePart, index) => {
            if (index !== Number.parseInt(part)) return damagePart;

            return {
                ...damagePart,
                total: parsedRoll.total,
                dice: rerolledDice
            };
        });
        rollData.options.damage[damageKey].total = rollData.options.damage[damageKey].parts.reduce((acc, part) => {
            acc += part.total;
            return acc;
        }, 0);

        this.updatePartyData(
            {
                [`system.tagTeam.members.${memberKey}.rollData`]: rollData
            },
            this.getUpdatingParts(button)
        );
    }

    async getCriticalDamage(damage) {
        const newDamage = foundry.utils.deepClone(damage);
        for (let key in newDamage) {
            var damage = newDamage[key];
            damage.formula = '';
            damage.total = 0;

            for (let part of damage.parts) {
                const criticalDamage = await getCritDamageBonus(part.formula);
                if (criticalDamage) {
                    part.modifierTotal += criticalDamage;
                    part.total += criticalDamage;
                    part.formula = `${part.dice.map(x => x.formula).join(' + ')} + ${part.modifierTotal}`;
                    part.roll = new Roll(part.formula);
                }

                damage.formula = [damage.formula, part.formula].filter(x => x).join(' + ');
                damage.total += part.total;
            }
        }

        return newDamage;
    }

    async getNonCriticalDamage(config) {
        const newDamage = foundry.utils.deepClone(config.damage);
        for (let key in newDamage) {
            var damage = newDamage[key];
            damage.formula = '';
            damage.total = 0;

            for (let part of damage.parts) {
                const critDamageBonus = await getCritDamageBonus(part.formula);
                part.modifierTotal -= critDamageBonus;
                part.total -= critDamageBonus;
                part.formula = `${part.dice.map(x => x.formula).join(' + ')} + ${part.modifierTotal}`;
                part.roll = new Roll(part.formula);

                damage.formula = [damage.formula, part.formula].filter(x => x).join(' + ');
                damage.total += part.total;
            }
        }

        return newDamage;
    }

    static async #selectRoll(_, button) {
        const { memberKey } = button.dataset;
        this.updatePartyData(
            {
                [`system.tagTeam.members`]: Object.entries(this.party.system.tagTeam.members).reduce(
                    (acc, [key, member]) => {
                        acc[key] = { selected: key === memberKey ? !member.selected : false };
                        return acc;
                    },
                    {}
                )
            },
            this.getUpdatingParts(button)
        );
    }

    async getJoinedRoll({ overrideIsCritical, displayVersion } = {}) {
        const memberValues = Object.values(this.party.system.tagTeam.members);
        const selectedRoll = memberValues.find(x => x.selected);
        let baseMainRoll = selectedRoll ?? memberValues[0];
        let baseSecondaryRoll = selectedRoll
            ? memberValues.find(x => !x.selected)
            : memberValues.length > 1
              ? memberValues[1]
              : null;

        if (!baseMainRoll?.rollData || !baseSecondaryRoll) return null;

        const mainRoll = new MemberData(baseMainRoll.toObject());
        const secondaryRollData = new MemberData(baseSecondaryRoll.toObject()).rollData;
        const systemData = mainRoll.rollData.options;
        const isCritical = overrideIsCritical ?? systemData.roll.isCritical;
        if (isCritical) systemData.damage = await this.getCriticalDamage(systemData.damage);

        if (secondaryRollData?.options.hasDamage) {
            const secondaryDamage = (displayVersion ? overrideIsCritical : isCritical)
                ? await this.getCriticalDamage(secondaryRollData.options.damage)
                : secondaryRollData.options.damage;
            if (systemData.damage) {
                for (const key in secondaryDamage) {
                    const damage = secondaryDamage[key];
                    systemData.damage[key].formula = [systemData.damage[key].formula, damage.formula]
                        .filter(x => x)
                        .join(' + ');
                    systemData.damage[key].total += damage.total;
                    systemData.damage[key].parts.push(...damage.parts);
                }
            } else {
                systemData.damage = secondaryDamage;
            }
        }

        return mainRoll;
    }

    static async #onCancelRoll(_event, _button, options = { confirm: true }) {
        this.cancelRoll(options);
    }

    async cancelRoll(options = { confirm: true }) {
        if (options.confirm) {
            const confirmed = await foundry.applications.api.DialogV2.confirm({
                window: {
                    title: game.i18n.localize('DAGGERHEART.APPLICATIONS.TagTeamSelect.cancelConfirmTitle')
                },
                content: game.i18n.localize('DAGGERHEART.APPLICATIONS.TagTeamSelect.cancelConfirmText')
            });

            if (!confirmed) return;
        }

        await this.updatePartyData(
            {
                'system.tagTeam': {
                    initiator: null,
                    members: _replace({})
                }
            },
            [],
            { render: false }
        );

        this.close();
        game.socket.emit(`system.${CONFIG.DH.id}`, {
            action: socketEvent.Refresh,
            data: { refreshType: RefreshType.TagTeamRoll, action: 'close' }
        });
    }

    static async #finishRoll() {
        const error = this.checkInitiatorHopeError(this.party.system.tagTeam.initiator);
        if (error) return error;

        const joinedRoll = await this.getJoinedRoll();
        const mainRoll = joinedRoll.rollData;
        const finalRoll = foundry.utils.deepClone(joinedRoll.roll);

        const mainActor = this.party.system.partyMembers.find(x => x.uuid === mainRoll.options.source.actor);
        mainRoll.options.title = game.i18n.localize('DAGGERHEART.APPLICATIONS.TagTeamSelect.chatMessageRollTitle');
        const cls = getDocumentClass('ChatMessage'),
            msgData = {
                type: 'dualityRoll',
                user: game.user.id,
                title: game.i18n.localize('DAGGERHEART.APPLICATIONS.TagTeamSelect.title'),
                speaker: cls.getSpeaker({ actor: mainActor }),
                system: mainRoll.options,
                rolls: [JSON.stringify(joinedRoll.roll)],
                sound: null,
                flags: { core: { RollTable: true } }
            };

        await cls.create(msgData);

        /* Handle resource updates from the finished TagTeamRoll */
        const tagTeamData = this.party.system.tagTeam;
        const fearUpdate = { key: 'fear', value: null, total: null, enabled: true };
        for (let memberId in tagTeamData.members) {
            const resourceUpdates = [];
            const rollGivesHope = finalRoll.isCritical || finalRoll.withHope;
            if (memberId === tagTeamData.initiator.memberId) {
                const value = tagTeamData.initiator.cost
                    ? rollGivesHope
                        ? 1 - tagTeamData.initiator.cost
                        : -tagTeamData.initiator.cost
                    : 1;
                resourceUpdates.push({ key: 'hope', value: value, total: -value, enabled: true });
            } else if (rollGivesHope) {
                resourceUpdates.push({ key: 'hope', value: 1, total: -1, enabled: true });
            }
            if (finalRoll.isCritical) resourceUpdates.push({ key: 'stress', value: -1, total: 1, enabled: true });
            if (finalRoll.withFear) {
                fearUpdate.value = fearUpdate.value === null ? 1 : fearUpdate.value + 1;
                fearUpdate.total = fearUpdate.total === null ? -1 : fearUpdate.total - 1;
            }

            game.actors.get(memberId).modifyResource(resourceUpdates);
        }

        if (fearUpdate.value) {
            mainActor.modifyResource([fearUpdate]);
        }

        /* Fin */
        this.cancelRoll({ confirm: false });
    }

    //#endregion
}
