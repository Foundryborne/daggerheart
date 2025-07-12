import { actionsTypes } from '../../../data/action/_module.mjs';
import DHActionConfig from '../../sheets-configs/action-config.mjs';
import DHBaseItemSheet from '../api/base-item.mjs';

export default class FeatureSheet extends DHBaseItemSheet {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        id: 'daggerheart-feature',
        classes: ['feature'],
        position: { height: 600 },
        window: { resizable: true },
        actions: {
            addAction: FeatureSheet.#addAction,
            editAction: FeatureSheet.#editAction,
            removeAction: FeatureSheet.#removeAction
        }
    };

    /**@override */
    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/items/feature/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        description: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-description.hbs' },
        actions: {
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-actions.hbs',
            scrollable: ['.actions']
        },
        effects: {
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-effects.hbs',
            scrollable: ['.effects']
        }
    };

    /**@override */
    static TABS = {
        primary: {
            tabs: [{ id: 'description' }, { id: 'actions' }, { id: 'effects' }],
            initial: 'description',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    /* -------------------------------------------- */

    /**@inheritdoc */
    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);

        return context;
    }

    /* -------------------------------------------- */
    /*  Application Clicks Actions                  */
    /* -------------------------------------------- */

    /**
     * Render a dialog prompting the user to select an action type.
     *
     * @returns {Promise<object>} An object containing the selected action type.
     */
    static async selectActionType() {
        const content = await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/actionTypes/actionType.hbs',
                {
                    types: CONFIG.DH.ACTIONS.actionTypes,
                    itemName: game.i18n.localize('DAGGERHEART.CONFIG.SelectAction.selectType')
                }
            ),
            title = game.i18n.localize('DAGGERHEART.CONFIG.SelectAction.selectType');
        console.log(this.document);

        return foundry.applications.api.DialogV2.prompt({
            window: { title },
            classes: ['daggerheart', 'dh-style'],
            content,
            ok: {
                label: title,
                callback: (event, button, dialog) => button.form.elements.type.value
            }
        });
    }

    /**
     * Add a new action to the item, prompting the user for its type.
     * @param {PointerEvent} _event - The originating click event
     * @param {HTMLElement} _button - The capturing HTML element which defines the [data-action="addAction"]
     */
    static async #addAction(_event, _button) {
        const actionType = await FeatureSheet.selectActionType();
        if (!actionType) return;
        try {
            const cls = actionsTypes[actionType] ?? actionsTypes.attack,
                action = new cls(
                    {
                        _id: foundry.utils.randomID(),
                        type: actionType,
                        name: game.i18n.localize(CONFIG.DH.ACTIONS.actionTypes[actionType].name),
                        ...cls.getSourceConfig(this.document)
                    },
                    {
                        parent: this.document
                    }
                );
            await this.document.update({ 'system.actions': [...this.document.system.actions, action] });
            await new DHActionConfig(this.document.system.actions[this.document.system.actions.length - 1]).render({
                force: true
            });
        } catch (error) {
            console.log(error);
        }
    }

    /**
     * Edit an existing action on the item
     * @param {PointerEvent} _event - The originating click event
     * @param {HTMLElement} button - The capturing HTML element which defines the [data-action="editAction"]
     */
    static async #editAction(_event, button) {
        const action = this.document.system.actions[button.dataset.index];
        await new DHActionConfig(action).render({ force: true });
    }

    /**
     * Remove an action from the item.
     * @param {PointerEvent} event - The originating click event
     * @param {HTMLElement} button - The capturing HTML element which defines the [data-action="removeAction"]
     */
    static async #removeAction(event, button) {
        event.stopPropagation();
        const actionIndex = button.closest('[data-index]').dataset.index;
        await this.document.update({
            'system.actions': this.document.system.actions.filter((_, index) => index !== Number.parseInt(actionIndex))
        });
    }
}
