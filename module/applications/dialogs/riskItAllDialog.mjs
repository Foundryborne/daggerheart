const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;
export default class RiskItAllDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(actor, config) {
        super({});

        this.actor = actor;
        this.validChoices = null;
        this.config = config;
    }

    get title() {
        return game.i18n.format('DAGGERHEART.APPLICATIONS.RiskItAllDialog.title', { actor: this.actor.name });
    }

    static DEFAULT_OPTIONS = {
        classes: ['daggerheart', 'dh-style', 'dialog', 'views', 'risk-it-all'],
        position: { width: 'auto', height: 'auto' },
        window: { icon: 'fa-solid fa-skull' },
        actions: {
            submit: this.submit
        }
    };

    static PARTS = {
        application: {
            id: 'risk-it-all',
            template: 'systems/daggerheart/templates/dialogs/riskItAllDialog.hbs'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.RiskItAllDialog = this.RiskItAllDialog;
        context.title = game.i18n.localize('DAGGERHEART.APPLICATIONS.RiskItAllDialog.submit');

        return context;
    }

    static async submit() {
        this.close();
    }
}
