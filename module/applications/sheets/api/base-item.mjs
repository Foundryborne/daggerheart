import autocomplete from 'autocompleter';
import { getDocFromElement } from '../../../helpers/utils.mjs';
import DHApplicationMixin from './application-mixin.mjs';

const { ItemSheetV2 } = foundry.applications.sheets;

/**
 * @typedef {import('@client/applications/_types.mjs').ApplicationClickAction} ApplicationClickAction *
 * @import DHItem from '../../../documents/item.mjs';
 /

/**
 * A base item sheet extending {@link ItemSheetV2} via {@link DHApplicationMixin}
 */
export default class DHBaseItemSheet extends DHApplicationMixin(ItemSheetV2) {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        classes: ['item'],
        position: { width: 600 },
        window: {
            resizable: true,
            controls: [
                {
                    icon: 'fa-solid fa-signature',
                    label: 'DAGGERHEART.UI.Tooltip.configureAttribution',
                    action: 'editAttribution'
                }
            ]
        },
        form: {
            submitOnChange: true
        },
        actions: {
            addFeature: DHBaseItemSheet.#addFeature,
            deleteFeature: DHBaseItemSheet.#deleteFeature,
            addResource: DHBaseItemSheet.#addResource,
            removeResource: DHBaseItemSheet.#removeResource,
            editGMNote: DHBaseItemSheet.#onEditGMNote
        },
        dragDrop: [
            { dragSelector: null, dropSelector: '.drop-section' },
            { dragSelector: '.feature-item', dropSelector: null },
            { dragSelector: '.inventory-item', dropSelector: null }
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
        const TextEditor = foundry.applications.ux.TextEditor.implementation;

        switch (partId) {
            case 'description':
                context.enrichedDescription = await this.document.system.getEnrichedDescription({ gmNotes: false });
                context.enrichedGMNotes = await TextEditor.implementation.enrichHTML(this.item.system.gmNotes, {
                    relativeTo: this.item,
                    rollData: this.item.getRollData(),
                    secrets: this.item.isOwner
                })
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

    /** @inheritdoc */
    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        // If the item supports lore references, add autocomplete
        const loreRefElement = htmlElement.querySelector('input[name="system.loreReference"]');
        const choiceKeys = Object.keys(CONFIG.DH.lore[this.item.type] ?? {});
        if (loreRefElement && choiceKeys) {
            const choices = choiceKeys.map(k => ({ value: k, label: k }));
            autocomplete({
                input: loreRefElement,
                fetch: function (text, update) {
                    if (!text) {
                        update(choices);
                    } else {
                        text = text.toLowerCase();
                        update(choices.filter(n => n.label.toLowerCase().includes(text)));
                    }
                },
                onSelect: item => {
                    this.item.update({ 'system.loreReference': String(item.value) });
                },
                click: e => e.fetch(),
                customize: function (_input, _inputRect, container) {
                    container.style.zIndex = foundry.applications.api.ApplicationV2._maxZ;
                },
                minLength: 0
            })
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
            onClick: async (_, target) => {
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

        const multiclass = this.document.system.isMulticlass ? 'multiclass' : null;
        let systemData = {};
        if (this.document.parent?.type === 'character') {
            systemData = {
                granter: {
                    id: this.document.id,
                    type: this.document.type,
                    identifier: multiclass ?? type
                }
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

        if (!feature) {
            await this.document.update({
                'system.features': this.document.system.features
                    .filter(x => x.item)
                    .map(x => ({ ...x, item: x.item.uuid }))
            });
        } else {
            const confirmed = await foundry.applications.api.DialogV2.confirm({
                window: {
                    title: game.i18n.format('DAGGERHEART.APPLICATIONS.DeleteConfirmation.title', {
                        type: game.i18n.localize('TYPES.Item.feature'),
                        name: feature.name
                    })
                },
                content: game.i18n.format('DAGGERHEART.APPLICATIONS.DeleteConfirmation.text', { name: feature.name })
            });

            if (!confirmed) return;

            await this.document.update({
                'system.features': this.document.system.features
                    .filter(x => target.dataset.type !== x.type || x.item.uuid !== feature.uuid)
                    .map(x => ({ ...x, item: x.item?.uuid }))
            });
        }
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
        /* Can prolly be improved a lot, but I don't wanna >_< */
        const featureItem = event.currentTarget.closest('.feature-item');
        const inventoryItem = event.currentTarget.closest('.inventory-item');
        const lineItem = event.currentTarget.closest('.item-line');
        const dragItemData = featureItem ?? inventoryItem ?? lineItem;

        const dragItem = await foundry.utils.fromUuid(dragItemData.dataset.itemUuid);
        if (dragItem) {
            if (!dragItem) {
                ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.featureIsMissing'));
                return;
            }

            let dragData;
            if (dragItemData.dataset.type === 'effect')
                dragData = {
                    type: 'ActiveEffect',
                    fromInternal: this.document.uuid,
                    data: { ...dragItem, uuid: dragItem.uuid, id: dragItem.id }
                };
            else dragData = { type: 'Item', uuid: dragItem.uuid, id: dragItem.id, fromInternal: this.document.id };

            event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
            event.dataTransfer.setDragImage(dragItemData.querySelector('img'), 60, 0);
        }
    }

    /**
     * On drop on the item.
     * @param {DragEvent} event - The drag event
     */
    async _onDrop(event) {
        event.stopPropagation();
        const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
        if (data.fromInternal === this.document.id) return;
        super._onDrop(event);
    }

    /**
     * @param {DragEvent} event 
     * @param {DHItem} item 
     */
    async _onDropItem(event, item) {
        const target = event.target.closest('fieldset.drop-section');
        if (item?.type === 'feature') {
            const cls = foundry.documents.Item.implementation;

            if (this.document.parent?.type === 'character') {
                const itemData = item.toObject();
                const multiclass = this.document.system.isMulticlass ? 'multiclass' : null;
                item = await cls.create(
                    {
                        ...itemData,
                        _stats: { compendiumSource: this.document.uuid },
                        system: {
                            ...itemData.system,
                            granter: {
                                id: this.document.id,
                                type: this.document.type,
                                identifier: multiclass ?? target.dataset.type
                            }
                        }
                    },
                    { parent: this.document.parent }
                );
            }

            if (target?.dataset.type) {
                await this.document.update(
                    {
                        'system.features': [...this.document.system.features, { type: target.dataset.type, item }].map(
                            x => ({
                                ...x,
                                item: x.item?.uuid
                            })
                        )
                    },
                    { parent: this.document.parent?.type === 'character' ? this.document.parent : undefined }
                );
            } else {
                await this.document.update(
                    {
                        'system.features': [...this.document.system.features, item].map(x => x.uuid)
                    },
                    { parent: this.document.parent?.type === 'character' ? this.document.parent : undefined }
                );
            }
        }
    }

    /**
     * Handle a dropped document on this item sheet. This extends the existing functionality to support more than AEs
     * @template {Document} TDocument
     * @param {DragEvent} event         The initiating drop event
     * @param {TDocument} document       The resolved Document class
     * @returns {Promise<TDocument|null>} A Document of the same type as the dropped one in case of a successful result,
     *                                    or null in case of failure or no action being taken
     * @protected
     * @override
     */
    async _onDropDocument(event, document) {
        switch (document.documentName) {
            case 'ActiveEffect':
                return (await this._onDropActiveEffect?.(event, document)) ?? null;
            case 'Actor':
                return (await this._onDropActor?.(event, document)) ?? null;
            case 'Item':
                return (await this._onDropItem?.(event, document)) ?? null;
            case 'Folder':
                return (await this._onDropFolder?.(event, document)) ?? null;
            default:
                return null;
        }
    }

    /** 
     * Handles the Add GM Note button being pressed. This is only used when an item has no GM notes.
     * Later edits to a GM note instead go through the normal editor toggle workflow.
     * @this DHBaseItemSheet
     */
    static #onEditGMNote() {
        // Open the editor, which might be hidden. We remove the css class to hide temporarily
        // so that menu auto resizing functions properly.
        const editor = this.element.querySelector('prose-mirror[name="system.gmNotes"]');
        const wasHidden = editor.classList.contains('hide-if-inactive');
        editor.classList.remove('hide-if-inactive');
        editor.open = true;
        window.setTimeout(() => {
            if (wasHidden) editor.classList.add('hide-if-inactive');
        }, 0);
    }

    /** @inheritdoc */
    async _onRender(context, options) {
        await super._onRender(context, options);

        // Render an add gmnotes button if there are no set GM notes.
        // We need to re-render on close since its possible to prosemirror to close *without* triggering a full re-render
        const item = this.item;
        if (game.user.isGM && item.system.metadata.hasDescription && !item.system.gmNotes) {
            const description = this.element.querySelector('[name="system.description"]');
            const addButton = () => {
                if (description.disabled || description.querySelector('[data-action=editGMNote]')) {
                    return;
                }

                const button = document.createElement('button');
                button.type = 'button';
                button.classList.add('icon', 'toggle', 'fa-regular', 'fa-note-medical');
                button.dataset.action = 'editGMNote';
                button.dataset.tooltip = 'DAGGERHEART.ITEMS.Base.addGMNote';
                description.appendChild(button);
            }
            
            addButton();
            description.addEventListener('close', () => addButton());
        }
    }
}
