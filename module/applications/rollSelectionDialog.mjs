const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class RollSelectionDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(experiences, hopeResource, resolve) {
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
            hopeResource: hopeResource
        };
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        id: 'roll-selection',
        classes: ['daggerheart', 'views', 'roll-selection'],
        position: {
            width: 400,
            height: 'auto'
        },
        actions: {
            selectExperience: this.selectExperience,
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
        context.experiences = Object.keys(this.experiences).map(id => ({ id, ...this.experiences[id] }));
        context.hopeResource = this.data.hopeResource + 1;

        return context;
    }

    static updateSelection(event, _, formData) {
        const { ...rest } = foundry.utils.expandObject(formData.object);

        this.data = foundry.utils.mergeObject(this.data, rest);
        this.render();
    }

    static selectExperience(_, button) {
        if (this.selectedExperiences.find(x => x.id === button.dataset.key)) {
            this.selectedExperiences = this.selectedExperiences.filter(x => x.id !== button.dataset.key);
        } else {
            this.selectedExperiences = [...this.selectedExperiences, button.dataset.key];
        }

        this.render();
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
            experiences: this.selectedExperiences.map(x => ({ id: x, ...this.experiences[x] }))
        });
        this.close();
    }
}
