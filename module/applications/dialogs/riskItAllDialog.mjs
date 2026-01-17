const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;
export default class RiskItAllDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(actor, resourceValue) {
        super({});

        this.actor = actor;
        this.resourceValue = resourceValue;
        this.choices = {
            hitPoints: 0,
            stress: 0
        };
    }

    get title() {
        return game.i18n.format('DAGGERHEART.APPLICATIONS.RiskItAllDialog.title', { name: this.actor.name });
    }

    static DEFAULT_OPTIONS = {
        classes: ['daggerheart', 'dh-style', 'dialog', 'views', 'risk-it-all'],
        position: { width: 280, height: 'auto' },
        window: { icon: 'fa-solid fa-dice fa-xl' },
        actions: {
            finish: RiskItAllDialog.#finish
        }
    };

    static PARTS = {
        application: {
            id: 'risk-it-all',
            template: 'systems/daggerheart/templates/dialogs/riskItAllDialog.hbs'
        }
    };

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        for (const input of htmlElement.querySelectorAll('.resource-container input'))
            input.addEventListener('change', this.updateChoice.bind(this));
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.resourceValue = this.resourceValue;
        context.maxHitPointsValue = Math.min(this.resourceValue, this.actor.system.resources.hitPoints.max);
        context.maxStressValue = Math.min(this.resourceValue, this.actor.system.resources.stress.max);
        context.remainingResource = this.resourceValue - this.choices.hitPoints - this.choices.stress;
        context.unfinished = context.remainingResource !== 0;

        context.choices = this.choices;
        context.final = {
            hitPoints: {
                value: this.actor.system.resources.hitPoints.value - this.choices.hitPoints,
                max: this.actor.system.resources.hitPoints.max
            },
            stress: {
                value: this.actor.system.resources.stress.value - this.choices.stress,
                max: this.actor.system.resources.stress.max
            }
        };

        context;

        return context;
    }

    updateChoice(event) {
        let value = Number.parseInt(event.target.value);
        const choiceKey = event.target.dataset.choice;
        const actorValue = this.actor.system.resources[choiceKey].value;
        const remaining = this.resourceValue - this.choices.hitPoints - this.choices.stress;
        const changeAmount = value - this.choices[choiceKey];

        /* If trying to increase beyond remaining resource points, just increase to max available */
        if (remaining - changeAmount < 0) value = this.choices[choiceKey] + remaining;
        else if (actorValue - value < 0) value = actorValue;

        this.choices[choiceKey] = value;
        this.render();
    }

    static async #finish() {
        const resourceUpdate = Object.keys(this.choices).reduce((acc, resourceKey) => {
            const value = this.actor.system.resources[resourceKey].value - this.choices[resourceKey];
            acc[resourceKey] = { value };
            return acc;
        }, {});

        await this.actor.update({
            'system.resources': resourceUpdate
        });

        this.close();
    }
}
