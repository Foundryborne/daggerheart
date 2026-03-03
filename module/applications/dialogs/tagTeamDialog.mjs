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
            rerollDice: TagTeamDialog.#rerollDice
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

                    acc[actorId] = {
                        ...data,
                        key: actorId,
                        readyToRoll: Boolean(data.rollChoice),
                        hasRolled: Boolean(data.rollData),
                        rollOptions
                    };

                    return acc;
                }, {});

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

    //#endregion
}
