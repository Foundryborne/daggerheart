export default class NpcRollSelectionDialog extends FormApplication {
    constructor(experiences, resolve, isNpc) {
        super({}, {});

        this.experiences = experiences;
        this.resolve = resolve;
        this.selectedExperiences = [];
        this.data = {
            nrDice: 1,
            advantage: null
        };
    }

    get title() {
        return 'Roll Options';
    }

    static get defaultOptions() {
        const defaults = super.defaultOptions;
        const overrides = {
            height: 'auto',
            width: 400,
            id: 'roll-selection',
            template: 'systems/daggerheart/templates/views/npcRollSelection.hbs',
            closeOnSubmit: false,
            submitOnChange: true,
            classes: ['daggerheart', 'views', 'npc-roll-selection']
        };

        const mergedOptions = foundry.utils.mergeObject(defaults, overrides);

        return mergedOptions;
    }

    async getData() {
        const context = super.getData();
        context.nrDice = this.data.nrDice;
        context.advantage = this.data.advantage;
        context.experiences = this.experiences.map(x => ({
            ...x,
            selected: this.selectedExperiences.find(selected => selected.id === x.id)
        }));

        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('.increase').click(_ => this.updateNrDice(1));
        html.find('.decrease').click(_ => this.updateNrDice(-1));
        html.find('.advantage').click(_ => this.updateIsAdvantage(true));
        html.find('.disadvantage').click(_ => this.updateIsAdvantage(false));
        html.find('.roll-button').click(this.finish.bind(this));
        html.find('.roll-dialog-chip').click(this.selectExperience.bind(this));
    }

    updateNrDice(value) {
        this.data.nrDice += value;
        this.render();
    }

    updateIsAdvantage(advantage) {
        this.data.advantage = this.data.advantage === advantage ? null : advantage;
        this.render();
    }

    selectExperience(event) {
        const experience = this.experiences[event.currentTarget.dataset.key];
        this.selectedExperiences = this.selectedExperiences.find(x => x.name === experience.name)
            ? this.selectedExperiences.filter(x => x.name !== experience.name)
            : [...this.selectedExperiences, experience];

        this.render();
    }

    finish() {
        this.resolve({ ...this.data, experiences: this.selectedExperiences });
        this.close();
    }
}
