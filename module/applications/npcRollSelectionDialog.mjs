/** NOT USED ANYMORE - TO BE DELETED **/

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class NpcRollSelectionDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(experiences, resolve, reject) {
        super({});

        this.experiences = experiences;
        this.resolve = resolve;
        this.reject = reject;
        this.selectedExperiences = [];
        this.data = {
            advantage: null
        };
    }

    get title() {
        return game.i18n.localize('DAGGERHEART.Application.RollSelection.Title');
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'views', 'npc-roll-selection'],
        position: { width: '500', height: 'auto' },
        actions: {
            updateIsAdvantage: this.updateIsAdvantage,
            selectExperience: this.selectExperience
        },
        form: { handler: this.updateData, submitOnChange: false }
    };

    static PARTS = {
        main: {
            id: 'main',
            template: 'systems/daggerheart/templates/views/npcRollSelection.hbs'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.advantage = this.data.advantage;
        context.experiences = Object.values(this.experiences).map(x => ({
            ...x,
            selected: this.selectedExperiences.find(selected => selected.id === x.id),
            value: `${x.value >= 0 ? '+' : '-'}${x.value}`
        }));

        return context;
    }

    static updateIsAdvantage(_, button) {
        const advantage = Boolean(button.dataset.advantage);
        this.data.advantage = this.data.advantage === advantage ? null : advantage;
        this.render();
    }

    static selectExperience(_, button) {
        const experience = Object.values(this.experiences).find(experience => experience.id === button.id);
        this.selectedExperiences = this.selectedExperiences.find(x => x.id === experience.id)
            ? this.selectedExperiences.filter(x => x.id !== experience.id)
            : [...this.selectedExperiences, experience];

        this.render();
    }

    static async updateData() {
        this.resolve({ ...this.data, experiences: this.selectedExperiences });
        this.close({ updateClose: true });
    }

    async close(options = {}) {
        const { updateClose, ...baseOptions } = options;
        if (!updateClose) {
            this.reject();
        }

        await super.close(baseOptions);
    }
}
