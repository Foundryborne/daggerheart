import DHApplicationMixin from './application-mixin.mjs';
import { actionsTypes } from '../../../data/_module.mjs';
import DHActionConfig from '../../config/Action.mjs';

const { ItemSheetV2 } = foundry.applications.sheets;

/**
 * A base item sheet extending {@link ItemSheetV2} via {@link DHApplicationMixin}
 * @extends ItemSheetV2
 * @mixes DHSheetV2
 */
export default class DHBaseItemSheet extends DHApplicationMixin(ItemSheetV2) {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        classes: ['item'],
        position: { width: 600 },
        form: {
            submitOnChange: true
        },
        actions: {
            addAction: DHBaseItemSheet.#addAction,
            editAction: DHBaseItemSheet.#editAction,
            removeAction: DHBaseItemSheet.#removeAction
        }
    };

    /* -------------------------------------------- */

    /** @inheritdoc */
    static TABS = {
        primary: {
            tabs: [{ id: 'description' }, { id: 'actions' }, { id: 'settings' }],
            initial: 'description',
            labelPrefix: 'DAGGERHEART.Sheets.TABS'
        }
    };

    /* -------------------------------------------- */
    /*  Prepare Context                             */
    /* -------------------------------------------- */

    /**@inheritdoc */
    async _preparePartContext(partId, context) {
        await super._preparePartContext(partId, context);
        const { TextEditor } = foundry.applications.ux;

        switch (partId) {
            case 'description':
                const value = foundry.utils.getProperty(this.document, 'system.description') ?? '';
                context.enrichedDescription = await TextEditor.enrichHTML(value, {
                    relativeTo: this.item,
                    rollData: this.item.getRollData(),
                    secrets: this.item.isOwner
                });
                break;
        }

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
                'systems/daggerheart/templates/views/actionType.hbs',
                { types: SYSTEM.ACTIONS.actionTypes }
            ),
            title = 'Select Action Type';

        return foundry.applications.api.DialogV2.prompt({
            window: { title },
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
        const actionType = await DHBaseItemSheet.selectActionType();
        if (!actionType) return;
        try {
            const cls = actionsTypes[actionType] ?? actionsTypes.attack,
                action = new cls(
                    {
                        _id: foundry.utils.randomID(),
                        type: actionType,
                        name: game.i18n.localize(SYSTEM.ACTIONS.actionTypes[actionType].name),
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
