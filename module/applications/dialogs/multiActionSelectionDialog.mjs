const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class MultiActionSelectionDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(titleName, actions, options = {}) {
        super(options);

        this.titleName = titleName;
        this.actions = actions;
        this.action = null;
    }

    /* -------------------------------------------- */

    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['daggerheart', 'dh-style', 'dialog', 'multi-action-dialog'],
        actions: {
            chooseAction: MultiActionSelectionDialog.#onChooseAction
        },
        position: { width: 400 }
    };

    /* -------------------------------------------- */

    static PARTS = {
        actions: {
            template: 'systems/daggerheart/templates/dialogs/multiActionSelect.hbs'
        }
    };

    /* -------------------------------------------- */

    /** @override */
    get title() {
        return this.titleName;
    }

    /* -------------------------------------------- */

    /** @inheritDoc */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.actions = this.actions;

        return context;
    }

    static async #onChooseAction(_, button) {
        const { actionId } = button.dataset;
        this.action = this.actions.find(a => a.id === actionId);

        this.close();
    }

    static create(titleName, actions, options) {
        return new Promise(resolve => {
            const dialog = new this(titleName, actions, options);
            dialog.addEventListener('close', () => resolve(dialog.action), { once: true });
            dialog.render({ force: true });
        });
    }
}
