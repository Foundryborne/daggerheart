const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * @import DHBaseAction from '../../data/action/baseAction.mjs';;
 */

/** 
 * Selection dialog when using multi actions, allowing to select what sub-action is being used.
 */
export default class MultiActionSelectionDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    /**
     * @param {string[]} titleName 
     * @param {DHBaseAction[]} actions 
     * @param {object} options 
     */
    constructor(titleName, actions, options = {}) {
        super(options);

        this.options.window.title = titleName;
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

    static PARTS = {
        actions: {
            template: 'systems/daggerheart/templates/dialogs/multiActionSelect.hbs'
        }
    };

    /* -------------------------------------------- */

    /** @inheritDoc */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.actions = this.actions;

        return context;
    }

    /**
     * @this MultiActionSelectionDialog
     * @type {ApplicationClickAction}
     */
    static async #onChooseAction(_, button) {
        const { actionId } = button.dataset;
        this.action = this.actions.find(a => a.id === actionId);

        this.close();
    }

    /**
     * @param {string[]} titleName 
     * @param {DHBaseAction[]} actions 
     * @param {object} options 
     * @returns {Promise<DHBaseAction | undefined>}
     */
    static create(titleName, actions, options) {
        return new Promise(resolve => {
            const dialog = new this(titleName, actions, options);
            dialog.addEventListener('close', () => resolve(dialog.action), { once: true });
            dialog.render({ force: true });
        });
    }
}
