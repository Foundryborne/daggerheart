const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;
export default class RiskItAllDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(actor, config) {
        super({});

        this.actor = actor;
        this.validChoices = null;
        this.config = config;
    }

    get title() {
        return game.i18n.format('DAGGERHEART.APPLICATIONS.RiskItAllDialog.title', { name: this.actor.name });
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
        context.title = game.i18n.format('DAGGERHEART.APPLICATIONS.RiskItAllDialog.subtitle', { hope: this.config.hope });
        context.currentHitPointsLabel = "Current Marked Hit Points: " + this.actor.system.resources.hitPoints.value;
        context.currentStressLabel = "Current Marked Stress: " + this.actor.system.resources.stress.value;

        context.newHitPoints = this.actor.system.resources.hitPoints.value;
        context.newStress = this.actor.system.resources.stress.value;

        return context;
    }

    static checkForValidChoice() {
        /*
        TODO:

        return (this.config.hope == (this.actor.system.resources.hitPoints.value - newHitPointValue) + (this.actor.system.resources.stress.value - newStressValue));
        */
       return true;
    }

    static async submit() {
        this.close();
        // TODO: Update actor with changes.
        await this.actor.update({
            system: {
                resources: {
                    hitPoints: {
                        value: 0 // TODO put editted value here
                    },
                    stress: {
                        value: 0 // TODO put editted value here
                    }
                }
            }
        });
    }
}
