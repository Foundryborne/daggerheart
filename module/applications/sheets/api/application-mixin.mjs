const { HandlebarsApplicationMixin } = foundry.applications.api;
import { getDocFromElement, getDocFromElementSync, tagifyElement } from '../../../helpers/utils.mjs';
import { ItemBrowser } from '../../ui/itemBrowser.mjs';

const typeSettingsMap = {
    character: 'extendCharacterDescriptions',
    adversary: 'extendAdversaryDescriptions',
    environment: 'extendEnvironmentDescriptions',
    ancestry: 'extendItemDescriptions',
    community: 'extendItemDescriptions',
    class: 'extendItemDescriptions',
    subclass: 'extendItemDescriptions',
    feature: 'extendItemDescriptions',
    domainCard: 'extendItemDescriptions',
    loot: 'extendItemDescriptions',
    consumable: 'extendItemDescriptions',
    weapon: 'extendItemDescriptions',
    armor: 'extendItemDescriptions',
    beastform: 'extendItemDescriptions'
};

/**
 * @typedef {import('@client/applications/_types.mjs').ApplicationClickAction} ApplicationClickAction
 */

/**
 * @typedef {object} DragDropConfig
 * @property {string} [dragSelector] - A CSS selector that identifies draggable elements.
 * @property {string} [dropSelector] - A CSS selector that identifies drop targets.
 *
 * @typedef {object} ContextMenuConfig
 * @property {() => ContextMenuEntry[]} handler - A handler function that provides initial context options
 * @property {string} selector - A CSS selector to which the ContextMenu will be bound
 * @property {object} [options] - Additional options which affect ContextMenu construction
 * @property {HTMLElement} [options.container] - A parent HTMLElement which contains the selector target
 * @property {string} [options.hookName] - The hook name
 * @property {boolean} [options.parentClassHooks=true] - Whether to call hooks for the parent classes in the inheritance chain.
 *
 * @typedef {Object} TagOption
 * @property {string} label
 * @property {string} [src]
 *
 * @typedef {object} TagifyConfig
 * @property {String} selector - The CSS selector for get the element to transform into a tag input
 * @property {Record<string, TagOption> | (() => Record<string, TagOption>)} options - Available tag options as key-value pairs
 * @property {TagChangeCallback} callback - Callback function triggered when tags change
 * @property {TagifyOptions} [tagifyOptions={}] - Additional configuration for Tagify
 *
 * @callback TagChangeCallback
 * @param {Array<{value: string, name: string, src?: string}>} selectedOptions - Current selected tags
 * @param {{option: string, removed: boolean}} change - What changed (added/removed tag)
 * @param {HTMLElement} inputElement - Original input element
 *
 *
 * @typedef {Object} TagifyOptions
 * @property {number} [maxTags] - Maximum number of allowed tags
 */

/**
 * @typedef {import("@client/applications/api/handlebars-application.mjs").HandlebarsRenderOptions} HandlebarsRenderOptions
 * @typedef {foundry.applications.types.ApplicationConfiguration} FoundryAppConfig
 *
 * @typedef {FoundryAppConfig & HandlebarsRenderOptions & {
 *   dragDrop?: DragDropConfig[],
 *   tagifyConfigs?: TagifyConfig[],
 *   contextMenus?: ContextMenuConfig[],
 * }} DHSheetV2Configuration
 */

/**
 * @template {new (...args: any[]) => {}} T
 * @arg Base {T}
 */
export default function DHApplicationMixin(Base) {
    class DHSheetV2 extends HandlebarsApplicationMixin(Base) {
        /**
         * @param {DHSheetV2Configuration} [options={}]
         */
        constructor(options = {}) {
            super(options);
            /**
             * @type {foundry.applications.ux.DragDrop[]}
             * @private
             */
            this._dragDrop = this._createDragDropHandlers();
        }

        /**
         * The default options for the sheet.
         * @type {DHSheetV2Configuration}
         */
        static DEFAULT_OPTIONS = {
            classes: ['daggerheart', 'sheet', 'dh-style'],
            actions: {
                triggerContextMenu: DHSheetV2.#triggerContextMenu,
                createDoc: DHSheetV2.#createDoc,
                editDoc: DHSheetV2.#editDoc,
                deleteDoc: DHSheetV2.#deleteDoc,
                toChat: DHSheetV2.#toChat,
                useItem: DHSheetV2.#useItem,
                toggleEffect: DHSheetV2.#toggleEffect,
                toggleExtended: DHSheetV2.#toggleExtended,
                addNewItem: DHSheetV2.#addNewItem,
                browseItem: DHSheetV2.#browseItem
            },
            contextMenus: [
                {
                    handler: DHSheetV2.#getEffectContextOptions,
                    selector: '[data-item-uuid][data-type="effect"]',
                    options: {
                        parentClassHooks: false,
                        fixed: true
                    }
                },
                {
                    handler: DHSheetV2.#getActionContextOptions,
                    selector: '[data-item-uuid][data-type="action"]',
                    options: {
                        parentClassHooks: false,
                        fixed: true
                    }
                }
            ],
            dragDrop: [],
            tagifyConfigs: []
        };

        /**
         * Related documents that should cause a rerender of this application when updated.
         */
        get relatedDocs() {
            return [];
        }

        /* -------------------------------------------- */

        /**@inheritdoc */
        _attachPartListeners(partId, htmlElement, options) {
            super._attachPartListeners(partId, htmlElement, options);
            this._dragDrop.forEach(d => d.bind(htmlElement));
        }

        /**@inheritdoc */
        async _onFirstRender(context, options) {
            await super._onFirstRender(context, options);

            const docs = [];
            for (const docData of this.relatedDocs) {
                if (!docData) continue;
                const doc = await foundry.utils.fromUuid(docData.uuid);
                docs.push(doc);
            }

            docs.filter(doc => doc).forEach(doc => (doc.apps[this.id] = this));

            if (!!this.options.contextMenus.length) this._createContextMenus();

            this.#autoExtendDescriptions(context);
        }

        /** @inheritDoc */
        _onClose(options) {
            super._onClose(options);
            this.relatedDocs.filter(doc => doc).map(doc => delete doc.apps[this.id]);
        }

        /**@inheritdoc */
        async _onRender(context, options) {
            await super._onRender(context, options);
            this._createTagifyElements(this.options.tagifyConfigs);
            await this.#prepareInventoryDescription(context);
        }

        /* -------------------------------------------- */
        /*  Sync Parts                                  */
        /* -------------------------------------------- */

        /**@inheritdoc */
        _syncPartState(partId, newElement, priorElement, state) {
            super._syncPartState(partId, newElement, priorElement, state);
            for (const el of priorElement.querySelectorAll('.extensible.extended')) {
                const { actionId, itemUuid } = el.parentElement.dataset;
                const selector = `${actionId ? `[data-action-id="${actionId}"]` : `[data-item-uuid="${itemUuid}"]`} .extensible`;
                const newExtensible = newElement.querySelector(selector);
                newExtensible?.classList.add('extended');
            }
        }

        /* -------------------------------------------- */
        /*  Tags                                        */
        /* -------------------------------------------- */

        /**
         * Creates Tagify elements from configuration objects
         * @param {TagifyConfig[]} tagConfigs - Array of Tagify configuration objects
         * @throws {TypeError} If tagConfigs is not an array
         * @throws {Error} If required properties are missing in config objects
         * @param {TagifyConfig[]} tagConfigs
         */
        _createTagifyElements(tagConfigs) {
            if (!Array.isArray(tagConfigs)) throw new TypeError('tagConfigs must be an array');

            tagConfigs.forEach(config => {
                try {
                    const { selector, options, callback, tagifyOptions = {} } = config;

                    // Validate required fields
                    if (!selector || !options || !callback) {
                        throw new Error('Invalid TagifyConfig - missing required properties', config);
                    }

                    // Find target element
                    const element = this.element.querySelector(selector);
                    if (!element) {
                        throw new Error(`Element not found with selector: ${selector}`);
                    }
                    // Resolve dynamic options if function provided
                    const resolvedOptions = typeof options === 'function' ? options.call(this) : options;

                    // Initialize Tagify
                    tagifyElement(element, resolvedOptions, callback.bind(this), tagifyOptions);
                } catch (error) {
                    console.error('Error initializing Tagify:', error);
                }
            });
        }

        /* -------------------------------------------- */
        /*  Drag and Drop                               */
        /* -------------------------------------------- */

        /**
         * Creates drag-drop handlers from the configured options.
         * @returns {foundry.applications.ux.DragDrop[]}
         * @private
         */
        _createDragDropHandlers() {
            return this.options.dragDrop.map(d => {
                d.callbacks = {
                    dragstart: this._onDragStart.bind(this),
                    drop: this._onDrop.bind(this)
                };
                return new foundry.applications.ux.DragDrop.implementation(d);
            });
        }

        /**
         * Handle dragStart event.
         * @param {DragEvent} event
         * @protected
         */
        _onDragStart(event) {}

        /**
         * Handle drop event.
         * @param {DragEvent} event
         * @protected
         */
        _onDrop(event) {}

        /* -------------------------------------------- */
        /*  Context Menu                                */
        /* -------------------------------------------- */

        /**
         * Create all configured context menus for this application ins tance.
         */
        _createContextMenus() {
            for (const config of this.options.contextMenus) {
                const { handler, selector, options } = config;
                this._createContextMenu(handler.bind(this), selector, options);
            }
        }

        /* -------------------------------------------- */

        /**
         * Get the set of ContextMenu options for ActiveEffects.
         * @returns {import('@client/applications/ux/context-menu.mjs').ContextMenuEntry[]} - The Array of context options passed to the ContextMenu instance
         * @this {DHSheetV2}
         * @protected
         */
        static #getEffectContextOptions() {
            /**@type {import('@client/applications/ux/context-menu.mjs').ContextMenuEntry[]} */
            const options = [
                {
                    name: 'disableEffect',
                    icon: 'fa-solid fa-lightbulb',
                    condition: target => {
                        const doc = getDocFromElementSync(target);
                        return doc && !doc.disabled;
                    },
                    callback: async target => (await getDocFromElement(target)).update({ disabled: true })
                },
                {
                    name: 'enableEffect',
                    icon: 'fa-regular fa-lightbulb',
                    condition: target => {
                        const doc = getDocFromElementSync(target);
                        return doc && doc.disabled;
                    },
                    callback: async target => (await getDocFromElement(target)).update({ disabled: false })
                }
            ].map(option => ({
                ...option,
                name: `DAGGERHEART.APPLICATIONS.ContextMenu.${option.name}`,
                icon: `<i class="${option.icon}"></i>`
            }));

            return [...options, ...this._getContextMenuCommonOptions.call(this, { toChat: true })];
        }

        /**
         * Get the set of ContextMenu options for Actions.
         * @returns {import('@client/applications/ux/context-menu.mjs').ContextMenuEntry[]} - The Array of context options passed to the ContextMenu instance
         * @this {DHSheetV2}
         * @protected
         */
        static #getActionContextOptions() {
            /**@type {import('@client/applications/ux/context-menu.mjs').ContextMenuEntry[]} */
            const options = [];
            return [...options, ...this._getContextMenuCommonOptions.call(this, { usable: true, toChat: true })];
        }

        /**
         * Get the common ContextMenu options for an element.
         * @param {Object} options
         * @param {boolean} [options.usable=false] - Whether to include an option to use the item or apply damage.
         * @param {boolean} [options.toChat=false] - Whether to include an option to send the item to chat.
         * @param {boolean} [options.deletable=true] - Whether to include an option to delete the item.
         *
         * @returns {import('@client/applications/ux/context-menu.mjs').ContextMenuEntry[]}
         */
        _getContextMenuCommonOptions({ usable = false, toChat = false, deletable = true }) {
            const options = [
                {
                    name: 'CONTROLS.CommonEdit',
                    icon: 'fa-solid fa-pen-to-square',
                    condition: target => {
                        const { dataset } = target.closest('[data-item-uuid]');
                        const doc = getDocFromElementSync(target);
                        return (
                            (!dataset.noCompendiumEdit && !doc) ||
                            (doc && (!doc?.hasOwnProperty('systemPath') || doc?.inCollection))
                        );
                    },
                    callback: async target => (await getDocFromElement(target)).sheet.render({ force: true })
                }
            ];

            if (usable) {
                options.unshift({
                    name: 'DAGGERHEART.GENERAL.damage',
                    icon: 'fa-solid fa-explosion',
                    condition: target => {
                        const doc = getDocFromElementSync(target);
                        return doc?.system?.attack?.damage.parts.length || doc?.damage?.parts.length;
                    },
                    callback: async (target, event) => {
                        const doc = await getDocFromElement(target),
                            action = doc?.system?.attack ?? doc;
                        return action && action.use(event, { byPassRoll: true });
                    }
                });

                options.unshift({
                    name: 'DAGGERHEART.APPLICATIONS.ContextMenu.useItem',
                    icon: 'fa-solid fa-burst',
                    condition: target => {
                        const doc = getDocFromElementSync(target);
                        return doc && !(doc.type === 'domainCard' && doc.system.inVault);
                    },
                    callback: async (target, event) => (await getDocFromElement(target)).use(event)
                });
            }

            if (toChat)
                options.push({
                    name: 'DAGGERHEART.APPLICATIONS.ContextMenu.sendToChat',
                    icon: 'fa-solid fa-message',
                    callback: async target => (await getDocFromElement(target)).toChat(this.document.id)
                });

            if (deletable)
                options.push({
                    name: 'CONTROLS.CommonDelete',
                    icon: 'fa-solid fa-trash',
                    callback: async (target, event) => {
                        const doc = await getDocFromElement(target);
                        if (event.shiftKey) return doc.delete();
                        else return doc.deleteDialog();
                    }
                });

            return options.map(option => ({
                ...option,
                icon: `<i class="${option.icon}"></i>`
            }));
        }

        /* -------------------------------------------- */
        /*  Prepare Context                             */
        /* -------------------------------------------- */

        /**@inheritdoc*/
        async _prepareContext(options) {
            const context = await super._prepareContext(options);
            context.config = CONFIG.DH;
            context.source = this.document;
            context.fields = this.document.schema.fields;
            context.systemFields = this.document.system.schema.fields;
            context.settings = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.appearance);
            return context;
        }

        /* -------------------------------------------- */
        /*  Prepare Descriptions                        */
        /* -------------------------------------------- */

        /**
         * Prepares and enriches an inventory item or action description for display.
         * @returns {Promise<void>}
         */
        async #prepareInventoryDescription(context) {
            // Get all inventory item elements with a data-item-uuid attribute
            const inventoryItems = this.element.querySelectorAll('.inventory-item[data-item-uuid]');
            for (const el of inventoryItems) {
                // Get the doc uuid from the element
                const { itemUuid } = el?.dataset || {};
                if (!itemUuid) continue;

                //get doc by uuid
                const doc = await fromUuid(itemUuid);

                //get inventory-item description element
                const descriptionElement = el.querySelector('.invetory-description');
                if (!doc || !descriptionElement) continue;

                // localize the description (idk if it's still necessary)
                const description = game.i18n.localize(doc.system?.description ?? doc.description);

                // Enrich the description and attach it;
                const isAction = doc.documentName === 'Action';
                descriptionElement.innerHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
                    description,
                    {
                        relativeTo: isAction ? doc.parent : doc,
                        rollData: doc.getRollData?.(),
                        secrets: isAction ? doc.parent.isOwner : doc.isOwner
                    }
                );
            }
        }

        /* -------------------------------------------- */
        /*  Extend Descriptions by Settings             */
        /* -------------------------------------------- */

        /**
         * Extend inventory description when enabled in settings.
         * @returns {Promise<void>}
         */
        async #autoExtendDescriptions(context) {
            const inventoryItems = this.element.querySelectorAll('.inventory-item[data-item-uuid]');
            for (const el of inventoryItems) {
                // Get the doc uuid from the element
                const { itemUuid } = el?.dataset || {};
                if (!itemUuid) continue;

                //get doc by uuid
                const doc = await fromUuid(itemUuid);

                //check the type of the document
                const actorType =
                    doc?.type === 'adversary' && context.document?.type === 'environment'
                        ? typeSettingsMap[doc?.type]
                        : doc.actor?.type;

                // If the actor type is defined and the setting is enabled, extend the description
                if (typeSettingsMap[actorType]) {
                    const settingKey = typeSettingsMap[actorType];
                    if (context.settings[settingKey]) this.#activeExtended(el);
                }
            }
        }

        /* -------------------------------------------- */
        /*  Application Clicks Actions                  */
        /* -------------------------------------------- */

        static async #addNewItem(event, target) {
            const createChoice = await foundry.applications.api.DialogV2.wait({
                classes: ['dh-style', 'two-big-buttons'],
                buttons: [
                    {
                        action: 'create',
                        label: 'Create Item',
                        icon: 'fa-solid fa-plus'
                    },
                    {
                        action: 'browse',
                        label: 'Browse Compendium',
                        icon: 'fa-solid fa-book'
                    }
                ]
            });

            if (!createChoice) return;

            if (createChoice === 'browse') return DHSheetV2.#browseItem.call(this, event, target);
            else return DHSheetV2.#createDoc.call(this, event, target);
        }

        static async #browseItem(event, target) {
            const type = target.dataset.compendium ?? target.dataset.type;

            const presets = {};

            switch (type) {
                case 'loot':
                case 'consumable':
                case 'armor':
                case 'weapon':
                    presets.compendium = 'daggerheart';
                    presets.folder = 'equipments';
                    presets.render = {
                        noFolder: true
                    };
                    presets.filter = {
                        type: { key: 'type', value: type, forced: true }
                    };
                    break;
                case 'domainCard':
                    presets.compendium = 'daggerheart';
                    presets.folder = 'domains';
                    presets.render = {
                        noFolder: true
                    };
                    presets.filter = {
                        'level.max': { key: 'level.max', value: this.document.system.levelData.level.current },
                        'system.domain': { key: 'system.domain', value: this.document.system.domains }
                    };
                    break;
                default:
                    return;
            }

            return new ItemBrowser({ presets }).render({ force: true });
        }

        /**
         * Create an embedded document.
         * @type {ApplicationClickAction}
         */
        static async #createDoc(event, target) {
            const { documentClass, type, inVault, disabled } = target.dataset;
            const parentIsItem = this.document.documentName === 'Item';
            const featureOnCharacter = this.document.parent?.type === 'character' && type === 'feature';
            const parent = featureOnCharacter
                ? this.document.parent
                : parentIsItem && documentClass === 'Item'
                  ? type === 'action'
                      ? this.document.system
                      : null
                  : this.document;

            let systemData = {};
            if (featureOnCharacter) {
                systemData = {
                    originItemType: this.document.type,
                    originId: this.document.id,
                    identifier: this.document.system.isMulticlass ? 'multiclass' : null
                };
            }

            const cls =
                type === 'action' ? game.system.api.models.actions.actionsTypes.base : getDocumentClass(documentClass);
            const data = {
                name: cls.defaultName({ type, parent }),
                type,
                system: systemData
            };
            if (inVault) data['system.inVault'] = true;
            if (disabled) data.disabled = true;

            const doc = await cls.create(data, { parent, renderSheet: !event.shiftKey });
            if (parentIsItem && type === 'feature') {
                await this.document.update({
                    'system.features': this.document.system.toObject().features.concat(doc.uuid)
                });
            }
            return doc;
        }

        /**
         * Renders an embedded document.
         * @type {ApplicationClickAction}
         */
        static async #editDoc(_event, target) {
            const doc = await getDocFromElement(target);
            if (doc) return doc.sheet.render({ force: true });
        }

        /**
         * Delete an embedded document.
         * @type {ApplicationClickAction}
         */
        static async #deleteDoc(event, target) {
            const doc = await getDocFromElement(target);
            if (doc) {
                if (event.shiftKey) return doc.delete();
                else return await doc.deleteDialog();
            }
        }

        /**
         * Send item to Chat
         * @type {ApplicationClickAction}
         */
        static async #toChat(_event, target) {
            let doc = await getDocFromElement(target);
            return doc.toChat(doc.uuid);
        }

        /**
         * Use a item
         * @type {ApplicationClickAction}
         */
        static async #useItem(event, target) {
            let doc = await getDocFromElement(target);
            await doc.use(event);
        }

        /**
         * Toggle a ActiveEffect
         * @type {ApplicationClickAction}
         */
        static async #toggleEffect(_, target) {
            const doc = await getDocFromElement(target);
            await doc.update({ disabled: !doc.disabled });
        }

        /**
         * Trigger the context menu.
         * @type {ApplicationClickAction}
         */
        static #triggerContextMenu(event, _) {
            return CONFIG.ux.ContextMenu.triggerContextMenu(event);
        }

        /**
         * Toggle the 'extended' class on the .extensible element inside inventory-item-content
         * @type {ApplicationClickAction}
         * @this {DHSheetV2}
         */
        static async #toggleExtended(_, target) {
            const container = target.closest('.inventory-item');
            const extensible = container?.querySelector('.extensible');
            extensible?.classList.toggle('extended');
        }

        async #activeExtended(element) {
            const extensible = element?.querySelector('.extensible');
            extensible?.classList.add('extended');
        }
    }

    return DHSheetV2;
}
