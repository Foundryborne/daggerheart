const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class CostSelectionDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(costs, uses, action, resolve) {
        super({});
        this.costs = costs;
        this.uses = uses;
        this.action = action;
        this.resolve = resolve;
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'views', 'damage-selection'],
        position: {
            width: 400,
            height: 'auto'
        },
        actions: {
            sendCost: this.sendCost
        },
        form: {
            handler: this.updateForm,
            submitOnChange: true,
            closeOnSubmit: false
        }
    };

    /** @override */
    static PARTS = {
        costSelection: {
            id: 'costSelection',
            template: 'systems/daggerheart/templates/views/costSelection.hbs'
        }
    };

    /* -------------------------------------------- */

    /** @inheritDoc */
    get title() {
        return `Cost Options`;
    }

    async _prepareContext(_options) {
        const updatedCosts = this.action.calcCosts(this.costs),
            updatedUses = this.action.calcUses(this.uses);
        return {
            costs: updatedCosts,
            uses: updatedUses,
            canUse: this.action.hasCost(updatedCosts) && this.action.hasUses(updatedUses)
        };
    }

    static async updateForm(event, _, formData) {
        const data = foundry.utils.expandObject(formData.object);
        this.costs = foundry.utils.mergeObject(this.costs, data.costs);
        this.uses = foundry.utils.mergeObject(this.uses, data.uses);
        this.render(true);
    }

    static sendCost(event) {
        event.preventDefault();
        this.resolve({ costs: this.action.getRealCosts(this.costs), uses: this.uses });
        this.close();
    }
}
