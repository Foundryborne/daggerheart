const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class RollSelectionDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(experiences, bonusDamage, hopeResource, resolve, isNpc) {
        super({}, {});

        this.experiences = experiences;
        this.resolve = resolve;
        this.isNpc;
        this.selectedExperiences = [];
        this.data = {
            diceOptions: [
                { name: 'd12', value: 'd12' },
                { name: 'd20', value: 'd20' }
            ],
            hope: ['d12'],
            fear: ['d12'],
            advantage: null,
            disadvantage: null,
            bonusDamage: bonusDamage.reduce((acc, x) => {
                if (x.appliesOn === SYSTEM.EFFECTS.applyLocations.attackRoll.id) {
                    acc.push({
                        ...x,
                        hopeUses: 0
                    });
                }

                return acc;
            }, []),
            hopeResource: hopeResource
        };
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'views', 'roll-selection'],
        position: {
            width: 400,
            height: 'auto'
        },
        actions: {
            selectExperience: this.selectExperience,
            decreaseHopeUse: this.decreaseHopeUse,
            increaseHopeUse: this.increaseHopeUse,
            setAdvantage: this.setAdvantage,
            setDisadvantage: this.setDisadvantage,
            finish: this.finish
        },
        form: {
            handler: this.updateSelection,
            submitOnChange: true,
            submitOnClose: false
        }
    };

    /** @override */
    static PARTS = {
        damageSelection: {
            id: 'damageSelection',
            template: 'systems/daggerheart/templates/views/rollSelection.hbs'
        }
    };

    get title() {
        return game.i18n.localize('DAGGERHEART.Application.RollSelection.Title');
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.isNpc = this.isNpc;
        context.diceOptions = this.data.diceOptions;
        context.hope = this.data.hope;
        context.fear = this.data.fear;
        context.advantage = this.data.advantage;
        context.disadvantage = this.data.disadvantage;
        context.experiences = this.experiences.map(x => ({
            ...x,
            selected: this.selectedExperiences.find(selected => selected.id === x.id)
        }));
        context.bonusDamage = this.data.bonusDamage;
        context.hopeResource = this.data.hopeResource + 1;
        context.hopeUsed = this.getHopeUsed();

        return context;
    }

    static updateSelection(event, _, formData) {
        const { bonusDamage, ...rest } = foundry.utils.expandObject(formData.object);

        for (var index in bonusDamage) {
            this.data.bonusDamage[index].initiallySelected = bonusDamage[index].initiallySelected;
            if (bonusDamage[index].hopeUses) {
                const value = Number.parseInt(bonusDamage[index].hopeUses);
                if (!Number.isNaN(value)) this.data.bonusDamage[index].hopeUses = value;
            }
        }

        this.data = foundry.utils.mergeObject(this.data, rest);
        this.render();
    }

    static selectExperience(_, button) {
        if (this.selectedExperiences.find(x => x.id === button.dataset.key)) {
            this.selectedExperiences = this.selectedExperiences.filter(x => x.id !== button.dataset.key);
        } else {
            this.selectedExperiences = [
                ...this.selectedExperiences,
                this.experiences.find(x => x.id === button.dataset.key)
            ];
        }

        this.render();
    }

    getHopeUsed() {
        return this.data.bonusDamage.reduce((acc, x) => acc + x.hopeUses, 0);
    }

    static decreaseHopeUse(_, button) {
        const index = Number.parseInt(button.dataset.index);
        if (this.data.bonusDamage[index].hopeUses - 1 >= 0) {
            this.data.bonusDamage[index].hopeUses -= 1;
            this.render(true);
        }
    }

    static increaseHopeUse(_, button) {
        const index = Number.parseInt(button.dataset.index);
        if (this.data.bonusDamage[index].hopeUses <= this.data.hopeResource + 1) {
            this.data.bonusDamage[index].hopeUses += 1;
            this.render(true);
        }
    }

    static setAdvantage() {
        this.data.advantage = this.data.advantage ? null : 'd6';
        this.data.disadvantage = null;

        this.render(true);
    }

    static setDisadvantage() {
        this.data.advantage = null;
        this.data.disadvantage = this.data.disadvantage ? null : 'd6';

        this.render(true);
    }

    static async finish() {
        const { diceOptions, ...rest } = this.data;
        this.resolve({
            ...rest,
            experiences: this.selectedExperiences,
            hopeUsed: this.getHopeUsed(),
            bonusDamage: this.data.bonusDamage.reduce((acc, x) => acc.concat(` + ${1 + x.hopeUses}${x.value}`), '')
        });
        this.close();
    }
}
