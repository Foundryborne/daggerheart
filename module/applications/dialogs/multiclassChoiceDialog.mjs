const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class MulticlassChoiceDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(actor, multiclass, options) {
        super(options);

        this.actor = actor;
        this.multiclass = multiclass;
        this.selectedDomain = null;
    }

    get title() {
        return game.i18n.format('DAGGERHEART.APPLICATIONS.MulticlassChoice.title', { actor: this.actor.name });
    }

    static DEFAULT_OPTIONS = {
        classes: ['daggerheart', 'dh-style', 'dialog', 'views', 'multiclass-choice'],
        position: { width: 'auto', height: 'auto' },
        window: { icon: 'fa-solid fa-person-rays' },
        actions: {
            save: MulticlassChoiceDialog.#save,
            selectDomain: MulticlassChoiceDialog.#selectDomain
        }
    };

    static PARTS = {
        application: {
            id: 'multiclass-choice',
            template: 'systems/daggerheart/templates/dialogs/multiclassChoice.hbs'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.multiclass = this.multiclass;
        context.domainChoices = this.multiclass.domains.map(value => {
            const domain = CONFIG.DH.DOMAIN.domains[value];
            return {
                value: value,
                label: game.i18n.localize(domain.label),
                description: game.i18n.localize(domain.description),
                src: domain.src,
                selected: value === this.selectedDomain,
                disabled: this.actor.system.domains.includes(value)
            };
        });
        context.multiclassDisabled = !this.selectedDomain;

        return context;
    }

    /** @override */
    _onClose(options = {}) {
        if (!options.submitted) this.move = null;
    }

    static async configure(actor, multiclass, options = {}) {
        return new Promise(resolve => {
            const app = new this(actor, multiclass, options);
            app.addEventListener('close', () => resolve(app.selectedDomain), { once: true });
            app.render({ force: true });
        });
    }

    static #save() {
        this.close({ submitted: true });
    }

    static #selectDomain(_event, button) {
        this.selectedDomain = this.selectedDomain === button.dataset.domain ? null : button.dataset.domain;
        this.render();
    }
}
