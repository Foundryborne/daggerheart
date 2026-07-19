import { ResourceUpdateMap } from '../../data/action/baseAction.mjs';
import { ChatDamageData } from '../../data/chat-message/chatDamageData.mjs';
import { MemberData } from '../../data/tagTeamData.mjs';
import { getCritDamageBonus, shouldUseHopeFearAutomation } from '../../helpers/utils.mjs';
import { emitGMUpdate, GMUpdateEvent, RefreshType, socketEvent } from '../../systemRegistration/socket.mjs';
import PartySheet from '../sheets/actors/party.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class TagTeamDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(party) {
        super({ id: `TagTeamDialog-${party.id}` });

        this.usesTagTeamHopeCost = true;
        this.party = party;
        this.partyMembers = party.system.partyMembers
            .filter(x => PartySheet.DICE_ROLL_ACTOR_TYPES.includes(x.type))
            .map(member => ({
                ...member.toObject(),
                uuid: member.uuid,
                id: member.id,
                selected: false,
                owned: member.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
            }));

        this.initiator = { cost: 
            this.party.system.schema.fields.tagTeam.fields.initiator.fields.cost.initial 
        };
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
        classes: ['daggerheart', 'views', 'dh-style', 'dialog', 'tag-team-dialog'],
        position: { width: 550, height: 'auto' },
        window: {
            icon: 'fa-solid fa-user-group'
        },
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
        tagTeamRoll: {
            id: 'tagTeamRoll',
            template: 'systems/daggerheart/templates/dialogs/tagTeamDialog/tagTeamRoll.hbs'
        },
        rollSelection: {
            id: 'rollSelection',
            template: 'systems/daggerheart/templates/dialogs/tagTeamDialog/rollSelection.hbs'
        },
        result: {
            id: 'result',
            template: 'systems/daggerheart/templates/dialogs/tagTeamDialog/result.hbs'
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
            .querySelector('.initiator-cost-input')
            ?.addEventListener('input', this.updateInitiatorCostField.bind(this));

        htmlElement
            .querySelector('.initiator-cost-enabled-checkbox')
            ?.addEventListener('change', this.toggleInitiatorCostEnabled.bind(this));

        htmlElement
            .querySelector('.openforall-field')
            ?.addEventListener('change', this.updateOpenForAllField.bind(this));
    }

    _configureRenderParts(options) {
        const parts = super._configureRenderParts(options);
        for (const memberKey of Object.keys(this.party.system.tagTeam.members)) {
            parts[memberKey] = {
                id: memberKey,
                template: 'systems/daggerheart/templates/dialogs/tagTeamDialog/tagTeamMember.hbs'
            };
        }

        return parts;
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.isEditable =
            game.user.isGM ||
            this.party.system.partyMembers.some(actor => {
                const selected = Boolean(this.party.system.tagTeam.members[actor.id]);
                return selected && actor.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER);
            });
        context.fields = this.party.system.schema.fields.tagTeam.fields;
        context.data = this.party.system.tagTeam;
        context.rollTypes = CONFIG.DH.GENERAL.tagTeamRollTypes;
        context.traitOptions = CONFIG.DH.ACTOR.abilities;
        context.members = {};
        context.allHaveRolled = Object.keys(this.party.system.tagTeam.members).every(key => {
            const data = this.party.system.tagTeam.members[key];
            const hasRolled = Boolean(data.rollData);
            if (!hasRolled) return false;

            return !data.rollData.options.hasDamage || data.damageRollData.active;
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
                partContext.usesTagTeamHopeCost = this.usesTagTeamHopeCost;

                break;
            case 'tagTeamRoll':
                partContext.memberKeys = Object.keys(this.party.system.tagTeam.members);
                break;
            case 'rollSelection':
                partContext.members = Object.keys(this.party.system.tagTeam.members).reduce((acc, key) => {
                    const member = this.party.system.tagTeam.members[key];
                    acc[key] = { selected: member.selected };
                    return acc;
                }, {});
                break;
            case 'result':
                const selectedRoll = Object.values(this.party.system.tagTeam.members).find(member => member.selected);
                const critSelected = !selectedRoll
                    ? undefined
                    : (selectedRoll?.roll?.isCritical ?? false);

                partContext.hintText = await this.getInfoTexts(this.party.system.tagTeam.members);
                partContext.joinedRoll = await this.getJoinedRoll({
                    overrideIsCritical: critSelected,
                    displayVersion: true
                });

                break;
        }

        if (Object.keys(this.party.system.tagTeam.members).includes(partId)) {
            const data = await this.#prepareMemberContext(partId);
            partContext.hasDamage |= Boolean(data?.damage);
            partContext.members[partId] = data;
        }

        return partContext;
    }

    async #prepareMemberContext(partId) {
        const data = this.party.system.tagTeam.members[partId] ?? {};
        const actor = game.actors.get(partId);
        if (!actor) console.error(`Failed to get actor ${partId}`);

        const rollOptions = [];
        const damageRollOptions = [];

        if (actor?.system.usedUnarmed) {
            damageRollOptions.push({
                value: actor.system.attack.uuid,
                label: actor.system.usedUnarmed.name,
                group: actor.name,
                baseAction: actor.system.attack
            });
        }

        for (const item of actor?.items ?? []) {
            if (!item.system.metadata.hasActions) continue;
            const actions = [...item.system.actions, ...(item.system.attack ? [item.system.attack] : [])];
            for (const action of actions) {
                if (action.hasRoll) {
                    const collection = action.hasDamage ? damageRollOptions : rollOptions;
                    collection.push({
                        value: action.uuid,
                        label: action.name,
                        group: item.name,
                        baseAction: action.baseAction
                    });
                }
            }
        }

        const selectedRoll = Object.values(this.party.system.tagTeam.members).find(member => member.selected);
        const critSelected = !selectedRoll ? undefined : (selectedRoll?.roll?.isCritical ?? false);

        return {
            ...data,
            roll: data.roll,
            isEditable: actor?.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER),
            key: partId,
            readyToRoll: Boolean(data.rollChoice),
            hasRolled: Boolean(data.rollData),
            rollOptions,
            damageRollOptions,
            damage: data.damageRollData,
            critDamage: await this.getCriticalDamage(data.damageRollData),
            useCritDamage: critSelected || (critSelected === undefined && data.roll?.isCritical)
        };
    }

    getUpdatingParts(target) {
        const { initialization, rollSelection, result } = this.constructor.PARTS;
        const isInitialization = this.tabGroups.application === initialization.id;
        const updatingMember = target.closest('.team-member-container')?.dataset?.memberKey;

        return [
            ...(isInitialization ? [initialization.id] : []),
            ...(updatingMember ? [updatingMember] : []),
            ...(!isInitialization ? [rollSelection.id] : []),
            ...(!isInitialization ? [result.id] : [])
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

        await emitGMUpdate(
            GMUpdateEvent.UpdateDocument,
            gmUpdate,
            update,
            this.party.uuid,
            options.render
                ? { refreshType: RefreshType.TagTeamRoll, action: 'refresh', parts: updatingParts }
                : undefined
        );
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
            const damageFinished = member.rollData?.options?.hasDamage ? member.damageRollData.active : true;

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

    toggleInitiatorCostEnabled(_event) {
        this.usesTagTeamHopeCost = !this.usesTagTeamHopeCost;
        this.initiator.cost = this.usesTagTeamHopeCost ? 
            this.party.system.schema.fields.tagTeam.fields.initiator.fields.cost.initial : 0;
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
        
        await this.updatePartyData(
            {
                [`system.tagTeam.members.${memberKey}.damageRollData`]: config.damage
            },
            this.getUpdatingParts(button)
        );
    }

    static async #removeDamageRoll(_, button) {
        const { memberKey } = button.dataset;
        this.updatePartyData(
            {
                [`system.tagTeam.members.${memberKey}.damageRollData`]: {
                    main: null,
                    resources: _replace({})
                }
            },
            this.getUpdatingParts(button)
        );
    }

    static async #rerollDamageDice(_, button) {
        const { isResource, memberKey, damageKey, diceIndex, resultIndex } = button.dataset;
        const memberData = this.party.system.tagTeam.members[memberKey];
        await memberData.damageRollData.rerollDamageDie(isResource, damageKey, diceIndex, resultIndex);

        const basePath = `system.tagTeam.members.${memberKey}.damageRollData`;
        const updatePath = isResource ? `${basePath}.resources.${damageKey}` : `${basePath}.main`;
        const updateValue = isResource ? 
            memberData.damageRollData.resources[damageKey] : memberData.damageRollData.main;
        this.updatePartyData(
            {
                [updatePath]: updateValue.toJSON()
            },
            this.getUpdatingParts(button)
        );
    }

    async getCriticalDamage(origDamage) {
        const newDamage = origDamage ? ChatDamageData.fromJSON(JSON.stringify(origDamage)) : null;
        if (newDamage?.main) {
            const criticalDamage = await getCritDamageBonus(newDamage.main.formula);
            if (criticalDamage) {
                const criticalTerm = new foundry.dice.terms.NumericTerm({ number: criticalDamage, evaluated: true });
                criticalTerm.evaluate();
                newDamage.main = await Roll.fromTerms([
                    ...origDamage.main.terms,
                    new foundry.dice.terms.OperatorTerm({ operator: '+' }),
                    criticalTerm
                ]);
                newDamage.main.options = foundry.utils.deepClone(origDamage.main.options);
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
            /* Selecting a roll must update all member sections hbs to display the correct damage information incase of a critical */
            [ 
                ...Object.keys(this.party.system.tagTeam.members),
                this.constructor.PARTS.rollSelection.id,
                this.constructor.PARTS.result.id
            ]
        );
    }

    async getJoinedRoll({ overrideIsCritical, displayVersion } = {}) {
        try {
            const memberValues = Object.values(this.party.system.tagTeam.members);
            const selectedRoll = memberValues.find(x => x.selected);
            const baseMainRoll = selectedRoll ?? memberValues[0];
            const baseSecondaryRoll = selectedRoll
                ? memberValues.find(x => !x.selected)
                : memberValues.length > 1
                    ? memberValues[1]
                    : null;

            if (!baseMainRoll?.rollData || !baseSecondaryRoll) return null;

            const mainRoll = new MemberData(baseMainRoll.toObject());
            mainRoll.damageRollData = baseMainRoll.damageRollData ? 
                ChatDamageData.fromJSON(JSON.stringify(baseMainRoll.damageRollData)) : null;
            const secondaryRoll = new MemberData(baseSecondaryRoll.toObject());
            secondaryRoll.damageRollData = baseSecondaryRoll.damageRollData ? 
                ChatDamageData.fromJSON(JSON.stringify(baseSecondaryRoll.damageRollData)) : null;

            const isCritical = overrideIsCritical ?? mainRoll.roll.isCritical;
            if (isCritical) mainRoll.damageRollData = await this.getCriticalDamage(mainRoll.damageRollData);

            if (secondaryRoll.damageRollData) {
                const secondaryDamage = (displayVersion ? overrideIsCritical : isCritical)
                    ? await this.getCriticalDamage(secondaryRoll.damageRollData)
                    : secondaryRoll.damageRollData;
                if (mainRoll.damageRollData) {
                    if (secondaryDamage.main) {
                        if (mainRoll.damageRollData.main) {
                            mainRoll.damageRollData.main = Roll.fromTerms([
                                ...baseMainRoll.damageRollData.main.terms,
                                new foundry.dice.terms.OperatorTerm({ operator: '+' }),
                                ...baseSecondaryRoll.damageRollData.main.terms
                            ]);

                            /* Joining the roll.options of both rolls */
                            const joinedDamageTypes = new Set([
                                ...baseMainRoll.damageRollData.main.options.damageTypes,
                                ...baseSecondaryRoll.damageRollData.main.options.damageTypes
                            ]);
                            mainRoll.damageRollData.main.options = {
                                ...baseMainRoll.damageRollData.main.options,
                                damageTypes: [...joinedDamageTypes]
                            };
                        } else {
                            mainRoll.damageRollData.main = secondaryDamage.main;
                        }
                    }

                    for (const [key, damage] of Object.entries(secondaryDamage.resources ?? {})) {
                        if (key in mainRoll.damageRollData.resources) {
                            mainRoll.damageRollData.resources[key] = Roll.fromTerms([
                                ...baseMainRoll.damageRollData.resources[key].terms,
                                new foundry.dice.terms.OperatorTerm({ operator: '+' }),
                                ...baseSecondaryRoll.damageRollData.resources[key].terms
                            ]);

                            /* Joining the roll.options of both rolls */
                            const joinedDamageTypes = new Set([
                                ...baseMainRoll.damageRollData.resources[key].options.damageTypes,
                                ...baseSecondaryRoll.damageRollData.resources[key].options.damageTypes
                            ]);
                            mainRoll.damageRollData.resources[key].options = {
                                ...baseMainRoll.damageRollData.resources[key].options,
                                damageTypes: [...joinedDamageTypes]
                            };
                        } else {
                            mainRoll.damageRollData.resources[key] = damage;
                        }
                    }
                } else {
                    mainRoll.damageRollData = secondaryDamage;
                }
            }

            return mainRoll;
        } catch (err) {
            console.error(err);
            return null;
        }
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
        
        /* This could assumably be done better. For some reason rolls don't get correctly done through rollData.toJSON */
        const systemData = {
            ...mainRoll.options,
            damage: joinedRoll.damageRollData?.toJSON()
        };

        if (joinedRoll.damageRollData.main) {
            systemData.damage.main = joinedRoll.damageRollData.toJSON();
        }
        for (const type of Object.keys(joinedRoll.damageRollData?.resources ?? {})) {
            systemData.damage.resources[type] = joinedRoll.damageRollData.resources[type].toJSON();
        }

        const cls = getDocumentClass('ChatMessage'),
            msgData = {
                type: 'dualityRoll',
                user: game.user.id,
                title: game.i18n.localize('DAGGERHEART.APPLICATIONS.TagTeamSelect.title'),
                speaker: cls.getSpeaker({ actor: mainActor }),
                system: systemData,
                rolls: [JSON.stringify(joinedRoll.roll)],
                sound: null,
                flags: { core: { RollTable: true } }
            };

        await cls.create(msgData);

        /* Handle resource updates from the finished TagTeamRoll */
        const tagTeamData = this.party.system.tagTeam;

        const actorResourceMaps = Object.keys(tagTeamData.members).reduce((acc, key) => {
            acc[key] = new ResourceUpdateMap(game.actors.get(key));
            return acc;
        }, {});

        if (shouldUseHopeFearAutomation({ gmAsPlayer: true })) {
            const fearResourceMap = actorResourceMaps[tagTeamData.initiator.memberId];
            for (const memberId in tagTeamData.members) {
                const resourceMap = actorResourceMaps[memberId]; 
                if (finalRoll.isCritical) {
                    resourceMap.addResources([
                        { key: 'stress', value: -1, enabled: true },
                        { key: 'hope', value: 1, enabled: true }
                    ]);
                } else if (finalRoll.withHope) {
                    resourceMap.addResources([{ key: 'hope', value: 1, enabled: true }]);
                } else if (finalRoll.withFear) {
                    fearResourceMap.addResources([{ key: 'fear', value: 1, enabled: true }]);
                }
            }
        } 

        /* Even with Hope/Fear automation off, the hope cost of performing the TagTeamRoll can still optionally be subtracted */
        if (tagTeamData.initiator.cost) {
            const resourceMap = actorResourceMaps[tagTeamData.initiator.memberId];
            resourceMap.addResources([{ key: 'hope', value: -tagTeamData.initiator.cost, enabled: true }]);
        }

        for (const resourceMap of Object.values(actorResourceMaps))
            resourceMap.updateResources();

        /* Fin */
        this.cancelRoll({ confirm: false });
    }

    //#endregion
}
