import { getDocFromElement } from '../../../helpers/utils.mjs';
import DHApplicationMixin from './application-mixin.mjs';

const { ItemSheetV2 } = foundry.applications.sheets;

/**@typedef {import('@client/applications/_types.mjs').ApplicationClickAction} ApplicationClickAction */

/**
 * A base item sheet extending {@link ItemSheetV2} via {@link DHApplicationMixin}
 */
export default class DHBaseItemSheet extends DHApplicationMixin(ItemSheetV2) {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        classes: ['item'],
        position: { width: 600 },
        window: { resizable: true },
        form: {
            submitOnChange: true
        },
        actions: {
            addFeature: DHBaseItemSheet.#addFeature,
            deleteFeature: DHBaseItemSheet.#deleteFeature,
            addResource: DHBaseItemSheet.#addResource,
            removeResource: DHBaseItemSheet.#removeResource
        },
        dragDrop: [
            { dragSelector: null, dropSelector: '.tab.features .drop-section' },
            { dragSelector: '.feature-item', dropSelector: null },
            { dragSelector: '.action-item', dropSelector: null }
        ],
        contextMenus: [
            {
                handler: DHBaseItemSheet.#getFeatureContextOptions,
                selector: '[data-item-uuid][data-type="feature"]',
                options: {
                    parentClassHooks: false,
                    fixed: true
                }
            }
        ]
    };

    /* -------------------------------------------- */

    /** @inheritdoc */
    static TABS = {
        primary: {
            tabs: [{ id: 'description' }, { id: 'settings' }, { id: 'actions' }, { id: 'effects' }],
            initial: 'description',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    /* -------------------------------------------- */
    /*  Prepare Context                             */
    /* -------------------------------------------- */

    /**@inheritdoc */
    async _preparePartContext(partId, context, options) {
        await super._preparePartContext(partId, context, options);
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
            case 'effects':
                await this._prepareEffectsContext(context, options);
                break;
            case 'features':
                context.isGM = game.user.isGM;
                break;
        }

        return context;
    }

    /**
     * Prepare render context for the Effect part.
     * @param {ApplicationRenderContext} context
     * @param {ApplicationRenderOptions} options
     * @returns {Promise<void>}
     * @protected
     */
    async _prepareEffectsContext(context, _options) {
        context.effects = {
            actives: [],
            inactives: []
        };

        for (const effect of this.item.effects) {
            const list = effect.active ? context.effects.actives : context.effects.inactives;
            list.push(effect);
        }
    }

    /* -------------------------------------------- */
    /*  Context Menu                                */
    /* -------------------------------------------- */

    /**
     * Get the set of ContextMenu options for Features.
     * @returns {import('@client/applications/ux/context-menu.mjs').ContextMenuEntry[]} - The Array of context options passed to the ContextMenu instance
     * @this {DHBaseItemSheet}
     * @protected
     */
    static #getFeatureContextOptions() {
        const options = this._getContextMenuCommonOptions({ usable: true, toChat: true, deletable: false });
        options.push({
            name: 'CONTROLS.CommonDelete',
            icon: '<i class="fa-solid fa-trash"></i>',
            callback: async target => {
                const feature = await getDocFromElement(target);
                if (!feature) return;
                const confirmed = await foundry.applications.api.DialogV2.confirm({
                    window: {
                        title: game.i18n.format('DAGGERHEART.APPLICATIONS.DeleteConfirmation.title', {
                            type: game.i18n.localize(`TYPES.Item.feature`),
                            name: feature.name
                        })
                    },
                    content: game.i18n.format('DAGGERHEART.APPLICATIONS.DeleteConfirmation.text', {
                        name: feature.name
                    })
                });
                if (!confirmed) return;
                await this.document.update({
                    'system.features': this.document.system.toObject().features.filter(uuid => uuid !== feature.uuid)
                });
            }
        });
        return options;
    }

    /* -------------------------------------------- */
    /*  Application Clicks Actions                  */
    /* -------------------------------------------- */

    /**
     * Add a new feature to the item, prompting the user for its type.
     * @type {ApplicationClickAction}
     */
    static async #addFeature(_, target) {
        const { type } = target.dataset;
        const cls = foundry.documents.Item.implementation;

        let systemData = {};
        if (this.document.parent?.type === 'character') {
            systemData = {
                originItemType: this.document.type,
                originId: this.document.id,
                identifier: this.document.system.isMulticlass ? 'multiclass' : null
            };
        }

        const item = await cls.create(
            {
                type: 'feature',
                name: cls.defaultName({ type: 'feature' }),
                system: systemData
            },
            { parent: this.document.parent?.type === 'character' ? this.document.parent : undefined }
        );
        await this.document.update({
            'system.features': [...this.document.system.features, { type, item }].map(x => ({
                ...x,
                item: x.item?.uuid
            }))
        });
    }

    /**
     * Remove a feature from the item.
     * @type {ApplicationClickAction}
     */
    static async #deleteFeature(_, element) {
        const target = element.closest('[data-item-uuid]');
        const feature = await getDocFromElement(target);
        if (!feature) return ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.featureIsMissing'));
        await this.document.update({
            'system.features': this.document.system.features
                .filter(x => target.dataset.type !== x.type || x.item.uuid !== feature.uuid)
                .map(x => ({ ...x, item: x.item.uuid }))
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

        const target = event.target.closest('fieldset.drop-section');
        const item = await fromUuid(data.uuid);
        if (item?.type === 'feature') {
            if (target.dataset.type) {
                await this.document.update({
                    'system.features': [...this.document.system.features, { type: target.dataset.type, item }].map(
                        x => ({
                            ...x,
                            item: x.item?.uuid
                        })
                    )
                });
            } else {
                await this.document.update({
                    'system.features': [...this.document.system.features, item].map(x => x.uuid)
                });
            }
        }
    }
}
