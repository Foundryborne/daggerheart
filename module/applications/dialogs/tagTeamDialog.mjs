import { getCritDamageBonus } from '../../helpers/utils.mjs';
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
                selected: false
            }));

        this.tabGroups.application = Object.keys(party.system.tagTeam.members).length
            ? 'tagTeamRoll'
            : 'initialization';
    }

    get title() {
        return game.i18n.localize('DAGGERHEART.APPLICATIONS.TagTeamSelect.title');
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
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
            selectRoll: TagTeamDialog.#selectRoll,
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
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);

        return context;
    }

    async _preparePartContext(partId, context, options) {
        const partContext = await super._preparePartContext(partId, context, options);
        switch (partId) {
            case 'initialization':
                partContext.memberSelection = this.partyMembers;
                partContext.allSelected = partContext.memberSelection.filter(x => x.selected).length >= 2;
                break;
            case 'tagTeamRoll':
                partContext.fields = this.party.system.schema.fields.tagTeam.fields;
                partContext.data = this.party.system.tagTeam;
                partContext.rollTypes = CONFIG.DH.GENERAL.tagTeamRollTypes;
                partContext.traitOptions = CONFIG.DH.ACTOR.abilities;

                const selectedRoll = Object.values(this.party.system.tagTeam.members).find(member => member.selected);
                const critSelected = !selectedRoll ? undefined : (selectedRoll?.rollData?.options?.isCritical ?? false);
                partContext.members = Object.keys(this.party.system.tagTeam.members).reduce((acc, actorId) => {
                    const data = this.party.system.tagTeam.members[actorId];
                    const actor = game.actors.get(actorId);
                    const rollOptions = actor.items.reduce((acc, item) => {
                        if (item.system.metadata.hasActions)
                            acc.push(
                                ...item.system.actions.reduce((acc, action) => {
                                    if (action.hasRoll)
                                        acc.push({
                                            value: action.uuid,
                                            label: action.name,
                                            group: item.name
                                        });

                                    return acc;
                                }, [])
                            );

                        return acc;
                    }, []);

                    const hitPointsDamage = data.rollData?.options?.damage?.hitPoints;
                    const preCritHitPointsDamage = data.rollData?.options?.damage?.hitPoints?.preCritData?.hitPoints;

                    acc[actorId] = {
                        ...data,
                        key: actorId,
                        readyToRoll: Boolean(data.rollChoice),
                        hasRolled: Boolean(data.rollData),
                        rollOptions,
                        damage: hitPointsDamage,
                        preCritDamage: preCritHitPointsDamage,
                        useCritFallback: selectedRoll !== data && critSelected === false
                    };

                    return acc;
                }, {});

                const { hint, totalDamage } = await this.getInfoTexts(this.party.system.tagTeam.members, critSelected);
                partContext.hintText = hint;
                partContext.totalDamage = totalDamage;

                break;
        }

        return partContext;
    }

    static async updateData(_event, _, formData) {
        const form = foundry.utils.expandObject(formData.object);
        await this.party.update(form);
        this.render(true);
    }

    //#region Initialization
    static #toggleSelectMember(_, button) {
        const member = this.partyMembers.find(x => x.id === button.dataset.id);
        member.selected = !member.selected;
        this.render();
    }

    static async #startTagTeamRoll() {
        await this.party.update({
            'system.==tagTeam': new game.system.api.data.TagTeamData({
                ...this.party.system.tagTeam.toObject(),
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
        });
        /* Update Party data and refresh all views */
        this.tabGroups.application = 'tagTeamRoll';

        this.render();
    }
    //#endregion
    //#region Tag Team Roll

    async getInfoTexts(members, critSelected) {
        let rollsAreFinished = true;
        let rollIsSelected = false;
        let totalDamage = null;
        for (const member of Object.values(members)) {
            const rollFinished = Boolean(member.rollData);

            const hasDamage = member.rollData?.options?.hasDamage;
            const damageFinished =
                member.rollData?.options?.hasDamage !== undefined ? member.rollData.options.damage : true;

            let hitPointDamage =
                critSelected === false && member.rollData?.options?.isCritical
                    ? member.rollData.options.damage?.hitPoints?.preCritData?.hitPoints?.total
                    : member.rollData?.options?.damage?.hitPoints?.total;
            if (critSelected && member.rollData?.options?.isCritical === false) {
                hitPointDamage += await getCritDamageBonus(member.rollData.options.damage?.hitPoints?.formula ?? '');
            }

            if (hasDamage) totalDamage = (totalDamage ?? 0) + (hitPointDamage ?? 0);

            rollsAreFinished = rollsAreFinished && rollFinished && damageFinished;
            rollIsSelected = rollIsSelected || member.selected;
        }

        let hint = null;
        if (!rollsAreFinished) hint = game.i18n.localize('DAGGERHEART.APPLICATIONS.TagTeamSelect.hints.completeRolls');
        else if (!rollIsSelected) hint = game.i18n.localize('DAGGERHEART.APPLICATIONS.TagTeamSelect.hints.selectRoll');

        return { hint, totalDamage };
    }

    async updateRollType(event) {
        await this.party.update({
            [`system.tagTeam.members.${event.target.dataset.member}`]: {
                rollType: event.target.value,
                rollChoice: null
            }
        });

        this.render();
    }

    static async #removeRoll(_, button) {
        await this.party.update({
            [`system.tagTeam.members.${button.dataset.member}`]: {
                rollData: null,
                rollChoice: null
            }
        });

        this.render();
    }

    static async #makeRoll(event, button) {
        const { member } = button.dataset;

        let result = null;
        switch (this.party.system.tagTeam.members[member].rollType) {
            case CONFIG.DH.GENERAL.tagTeamRollTypes.trait.id:
                result = await this.makeTraitRoll(member);
                break;
            case CONFIG.DH.GENERAL.tagTeamRollTypes.ability.id:
                result = await this.makeAbilityRoll(event, member);
                break;
        }

        if (!result) return;

        if (!game.modules.get('dice-so-nice')?.active) foundry.audio.AudioHelper.play({ src: CONFIG.sounds.dice });

        const rollData = result.messageRoll.toJSON();
        delete rollData.options.messageRoll;
        await this.party.update({
            [`system.tagTeam.members.${member}.rollData`]: rollData
        });
        this.render();
    }

    async makeTraitRoll(memberKey) {
        const actor = game.actors.find(x => x.id === memberKey);
        if (!actor) return;

        const memberData = this.party.system.tagTeam.members[memberKey];
        return await actor.traitDiceRoll(memberData.rollChoice, {
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

        const dieIndex = diceType === 'hope' ? 0 : diceType === 'fear' ? 2 : 4;

        const { parsedRoll, newRoll } = await game.system.api.dice.DualityRoll.reroll(
            memberData.rollData,
            dieIndex,
            diceType
        );
        const rollData = parsedRoll.toJSON();
        await this.party.update({
            [`system.tagTeam.members.${member}.rollData`]: {
                ...rollData,
                options: {
                    ...rollData.options,
                    roll: newRoll
                }
            }
        });
        this.render();
    }

    static async #makeDamageRoll(_, button) {
        const { memberKey } = button.dataset;
        const actor = game.actors.find(x => x.id === memberKey);
        if (!actor) return;

        const memberData = this.party.system.tagTeam.members[memberKey];
        const action = await foundry.utils.fromUuid(memberData.rollChoice);
        const config = {
            source: {},
            skips: {
                createMessage: true,
                resources: true,
                triggers: true
            }
        };

        await action.workflow.get('damage').execute(config, null, true);
        if (!config.damage) return;

        if (memberData.rollData.options.isCritical && config.damage.hitPoints) {
            const critBonus = await getCritDamageBonus(config.damage.hitPoints.formula);
            if (critBonus) {
                config.damage.hitPoints.preCritData = foundry.utils.deepClone(config.damage);
                config.damage.hitPoints.total += critBonus;
                config.damage.hitPoints.formula = `${config.damage.hitPoints.formula} + ${critBonus}`;
                config.damage.hitPoints.parts[0].total += critBonus;
                config.damage.hitPoints.parts[0].formula = `${config.damage.hitPoints.parts[0].formula} + ${critBonus}`;
            }
        }

        const current = this.party.system.tagTeam.members[memberKey].rollData;
        await this.party.update({
            [`system.tagTeam.members.${memberKey}.rollData`]: {
                ...current,
                options: {
                    ...current.options,
                    damage: config.damage
                }
            }
        });

        this.render();
    }

    static async #removeDamageRoll(_, button) {
        const { memberKey } = button.dataset;
        const current = this.party.system.tagTeam.members[memberKey].rollData;
        await this.party.update({
            [`system.tagTeam.members.${memberKey}.rollData`]: {
                ...current,
                options: {
                    ...current.options,
                    damage: null
                }
            }
        });

        this.render();
    }

    static async #selectRoll(_, button) {
        const { memberKey } = button.dataset;
        await this.party.update({
            [`system.tagTeam.members`]: Object.entries(this.party.system.tagTeam.members).reduce(
                (acc, [key, member]) => {
                    acc[key] = { selected: key === memberKey ? !member.selected : false };
                    return acc;
                },
                {}
            )
        });
        this.render();
    }

    static async #finishRoll() {
        // const mainRollId = Object.keys(this.data.members).find(key => this.data.members[key].selected);
        // const mainRoll = game.messages.get(this.data.members[mainRollId].messageId);

        // if (this.data.initiator.cost) {
        //     const initiator = this.party.find(x => x.id === this.data.initiator.id);
        //     if (initiator.system.resources.hope.value < this.data.initiator.cost) {
        //         return ui.notifications.warn(
        //             game.i18n.localize('DAGGERHEART.APPLICATIONS.TagTeamSelect.insufficientHope')
        //         );
        //     }
        // }
        let mainRoll = null;
        let secondaryRoll = null;
        for (const member of Object.values(this.party.system.tagTeam.members)) {
            if (member.selected) mainRoll = foundry.utils.deepClone(member.rollData);
            else secondaryRoll = foundry.utils.deepClone(member.rollData);
        }

        if (!mainRoll || !secondaryRoll) return;

        const systemData = mainRoll.options;

        const criticalRoll = systemData.roll.isCritical;

        if (secondaryRoll.options.hasDamage && systemData.hasDamage) {
            for (let key in secondaryRoll.options.damage) {
                var damage = secondaryRoll.options.damage[key];
                const damageTotal =
                    !secondaryRoll.options.isCritical && criticalRoll
                        ? (await getCritDamageBonus(damage.formula)) + damage.total
                        : damage.total;
                const updatedDamageParts = damage.parts;
                if (systemData.damage[key]) {
                    if (!secondaryRoll.options.isCritical && criticalRoll) {
                        for (let part of updatedDamageParts) {
                            const criticalDamage = await getCritDamageBonus(part.formula);
                            if (criticalDamage) {
                                damage.formula = `${damage.formula} + ${criticalDamage}`;
                                part.formula = `${part.formula} + ${criticalDamage}`;
                                part.modifierTotal = part.modifierTotal + criticalDamage;
                                part.total += criticalDamage;
                                part.roll = new Roll(part.formula);
                            }
                        }
                    } else if (
                        secondaryRoll.options.isCritical &&
                        !criticalRoll &&
                        secondaryRoll.options.damage.hitPoints.preCritData
                    ) {
                        damage = secondaryRoll.options.damage.hitPoints.preCritData[key];
                    }

                    systemData.damage[key].formula = `${systemData.damage[key].formula} + ${damage.formula}`;
                    systemData.damage[key].total += damageTotal;
                    systemData.damage[key].parts = [...systemData.damage[key].parts, ...updatedDamageParts];
                } else {
                    systemData.damage[key] = { ...damage, total: damageTotal, parts: updatedDamageParts };
                }
            }
        }

        const mainActor = this.party.system.partyMembers.find(x => x.uuid === mainRoll.options.source.actor);
        systemData.title = game.i18n.localize('DAGGERHEART.APPLICATIONS.TagTeamSelect.chatMessageRollTitle');
        const cls = getDocumentClass('ChatMessage'),
            msgData = {
                type: 'dualityRoll',
                user: game.user.id,
                title: game.i18n.localize('DAGGERHEART.APPLICATIONS.TagTeamSelect.title'),
                speaker: cls.getSpeaker({ actor: mainActor }),
                system: systemData,
                rolls: [mainRoll],
                sound: null,
                flags: { core: { RollTable: true } }
            };

        await cls.create(msgData);

        // const fearUpdate = { key: 'fear', value: null, total: null, enabled: true };
        // for (let memberId of Object.keys(this.data.members)) {
        //     const resourceUpdates = [];
        //     const rollGivesHope = systemData.roll.isCritical || systemData.roll.result.duality === 1;
        //     if (memberId === this.data.initiator.id) {
        //         const value = this.data.initiator.cost
        //             ? rollGivesHope
        //                 ? 1 - this.data.initiator.cost
        //                 : -this.data.initiator.cost
        //             : 1;
        //         resourceUpdates.push({ key: 'hope', value: value, total: -value, enabled: true });
        //     } else if (rollGivesHope) {
        //         resourceUpdates.push({ key: 'hope', value: 1, total: -1, enabled: true });
        //     }
        //     if (systemData.roll.isCritical) resourceUpdates.push({ key: 'stress', value: -1, total: 1, enabled: true });
        //     if (systemData.roll.result.duality === -1) {
        //         fearUpdate.value = fearUpdate.value === null ? 1 : fearUpdate.value + 1;
        //         fearUpdate.total = fearUpdate.total === null ? -1 : fearUpdate.total - 1;
        //     }

        //     this.party.find(x => x.id === memberId).modifyResource(resourceUpdates);
        // }

        // if (fearUpdate.value) {
        //     this.party.find(x => x.id === mainRollId).modifyResource([fearUpdate]);
        // }

        /* Clear Party tag Team Data here */
    }

    //#endregion
}
