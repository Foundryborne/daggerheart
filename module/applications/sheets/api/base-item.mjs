import DHActionConfig from '../../sheets-configs/action-config.mjs';
import DHApplicationMixin from './application-mixin.mjs';

const { ItemSheetV2 } = foundry.applications.sheets;

/**@typedef {import('@client/applications/_types.mjs').ApplicationClickAction} ApplicationClickAction */

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
            removeAction: DHBaseItemSheet.#removeAction,
            addFeature: DHBaseItemSheet.#addFeature,
            editFeature: DHBaseItemSheet.#editFeature,
            removeFeature: DHBaseItemSheet.#removeFeature,
            addResource: DHBaseItemSheet.#addResource,
            removeResource: DHBaseItemSheet.#removeResource
        },
        dragDrop: [
            { dragSelector: null, dropSelector: '.tab.features .drop-section' },
            { dragSelector: '.feature-item', dropSelector: null },
            { dragSelector: '.action-item', dropSelector: null }
        ]
    };

    /* -------------------------------------------- */

    /** @inheritdoc */
    static TABS = {
        primary: {
            tabs: [{ id: 'description' }, { id: 'settings' }, { id: 'actions' }],
            initial: 'description',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
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
                'systems/daggerheart/templates/actionTypes/actionType.hbs',
                { types: CONFIG.DH.ACTIONS.actionTypes }
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
     * @type {ApplicationClickAction}
     */
    static async #addAction(_event, _button) {
        const actionType = await DHBaseItemSheet.selectActionType();
        if (!actionType) return;
        try {
            const cls =
                    game.system.api.models.actions.actionsTypes[actionType] ??
                    game.system.api.models.actions.actionsTypes.attack,
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
     * @type {ApplicationClickAction}
     */
    static async #editAction(_event, button) {
        const action = this.document.system.actions[button.dataset.index];
        await new DHActionConfig(action).render({ force: true });
    }

    /**
     * Remove an action from the item.
     * @type {ApplicationClickAction}
     */
    static async #removeAction(event, button) {
        event.stopPropagation();
        const actionIndex = button.closest('[data-index]').dataset.index;
        const action = this.document.system.actions[actionIndex];

        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: {
                title: game.i18n.format('DAGGERHEART.APPLICATIONS.DeleteConfirmation.title', {
                    type: game.i18n.localize(`DAGGERHEART.GENERAL.Action.single`),
                    name: action.name
                })
            },
            content: game.i18n.format('DAGGERHEART.APPLICATIONS.DeleteConfirmation.text', { name: action.name })
        });
        if (!confirmed) return;

        await this.document.update({
            'system.actions': this.document.system.actions.filter((_, index) => index !== Number.parseInt(actionIndex))
        });
    }

    /**
     * Add a new feature to the item, prompting the user for its type.
     * @type {ApplicationClickAction}
     */
    static async #addFeature(_event, _button) {
        const feature = await game.items.documentClass.create({
            type: 'feature',
            name: game.i18n.format('DOCUMENT.New', { type: game.i18n.localize('TYPES.Item.feature') })
        });
        await this.document.update({
            'system.features': [...this.document.system.features.filter(x => x).map(x => x.uuid), feature.uuid]
        });
    }

    /**
     * Edit an existing feature on the item
     * @type {ApplicationClickAction}
     */
    static async #editFeature(_event, button) {
        const target = button.closest('.feature-item');
        const feature = this.document.system.features.find(x => x?.id === target.id);
        if (!feature) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.featureIsMissing'));
            return;
        }

        feature.sheet.render(true);
    }

    /**
     * Remove a feature from the item.
     * @type {ApplicationClickAction}
     */
    static async #removeFeature(event, button) {
        event.stopPropagation();
        const target = button.closest('.feature-item');
        const feature = this.document.system.features.find(x => x && x.id === target.id);

        if (feature) {
            const confirmed = await foundry.applications.api.DialogV2.confirm({
                window: {
                    title: game.i18n.format('DAGGERHEART.APPLICATIONS.DeleteConfirmation.title', {
                        type: game.i18n.localize(`TYPES.Item.feature`),
                        name: feature.name
                    })
                },
                content: game.i18n.format('DAGGERHEART.APPLICATIONS.DeleteConfirmation.text', { name: feature.name })
            });
            if (!confirmed) return;
        }

        await this.document.update({
            'system.features': this.document.system.features
                .filter(feature => feature && feature.id !== target.id)
                .map(x => x.uuid)
        });
    }

    /**
     * Add a resource to the item.
     * @type {ApplicationClickAction}
     */
    static async #addResource() {
        await this.document.update({
            'system.resource': { type: 'simple', value: 0 }
        });
    }

    /**
     * Remove the resource from the item.
     * @type {ApplicationClickAction}
     */
    static async #removeResource() {
        await this.document.update({
            'system.resource': null
        });
    }

    /* -------------------------------------------- */
    /*  Application Drag/Drop                       */
    /* -------------------------------------------- */

    /**
     * On dragStart on the item.
     * @param {DragEvent} event - The drag event
     */
    async _onDragStart(event) {
        const featureItem = event.currentTarget.closest('.feature-item');

        if (featureItem) {
            const feature = this.document.system.features.find(x => x?.id === featureItem.id);
            if (!feature) {
                ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.featureIsMissing'));
                return;
            }

            const featureData = { type: 'Item', data: { ...feature.toObject(), _id: null }, fromInternal: true };
            event.dataTransfer.setData('text/plain', JSON.stringify(featureData));
            event.dataTransfer.setDragImage(featureItem.querySelector('img'), 60, 0);
        } else {
            const actionItem = event.currentTarget.closest('.action-item');
            if (actionItem) {
                const action = this.document.system.actions[actionItem.dataset.index];
                if (!action) {
                    ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.actionIsMissing'));
                    return;
                }

                const actionData = {
                    type: 'Action',
                    data: { ...action.toObject(), id: action.id, itemUuid: this.document.uuid },
                    fromInternal: true
                };
                event.dataTransfer.setData('text/plain', JSON.stringify(actionData));
                event.dataTransfer.setDragImage(actionItem.querySelector('img'), 60, 0);
            }
        }
    }

    /**
     * On drop on the item.
     * @param {DragEvent} event - The drag event
     */
    async _onDrop(event) {
        const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
        if (data.fromInternal) return;

        const item = await fromUuid(data.uuid);
        if (item?.type === 'feature') {
            const current = this.document.system.features.map(x => x.uuid);
            await this.document.update({ 'system.features': [...current, item.uuid] });
        }
    }
}
