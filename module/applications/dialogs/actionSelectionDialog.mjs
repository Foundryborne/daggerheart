const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class ActionSelectionDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(item, event, options = {}) {
        super(options);
        this.#item = item;
        this.#event = event;
    }

    /* -------------------------------------------- */

    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['daggerheart', 'dh-style', 'dialog'],
        actions: {
            choose: ActionSelectionDialog.#onChooseAction
        },
        position: {
            width: 400
        }
    };

    /* -------------------------------------------- */

    static PARTS = {
        actions: {
            template: 'systems/daggerheart/templates/dialogs/actionSelect.hbs'
        }
    };

    #item;

    get item() {
        return this.#item;
    }

    #event;

    get event() {
        return this.#event;
    }

    #action;

    get action() {
        return this.#action ?? null;
    }

    /* -------------------------------------------- */

    /** @override */
    get title() {
        return game.i18n.localize('DAGGERHEART.CONFIG.SelectAction.selectAction');
    }

    /* -------------------------------------------- */

    /** @inheritDoc */
    async _prepareContext(options) {
        const actions = this.#item.system.actionsList,
            itemName = this.#item.name;
        return {
            ...(await super._prepareContext(options)),
            actions,
            itemName
        };
    }

    static async #onChooseAction(event, button) {
        const { actionId } = button.dataset;
        this.#action = this.#item.system.actionsList.find(a => a._id === actionId);
        Object.defineProperty(this.#event, 'shiftKey', {
            get() {
                return event.shiftKey;
            }
        });
        this.close();
    }

    static create(item, event, options) {
        return new Promise(resolve => {
            const dialog = new this(item, event, options);
            dialog.addEventListener('close', () => resolve(dialog.action), { once: true });
            dialog.render({ force: true });
        });
    }
}
