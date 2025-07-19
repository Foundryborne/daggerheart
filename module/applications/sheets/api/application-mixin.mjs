const { HandlebarsApplicationMixin } = foundry.applications.api;
import { getDocFromElement, tagifyElement } from '../../../helpers/utils.mjs';
import DHActionConfig from '../../sheets-configs/action-config.mjs';

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
 * @template {Constructor<foundry.applications.api.DocumentSheet>} BaseDocumentSheet
 * @param {BaseDocumentSheet} Base - The base class to extend.
 * @returns {BaseDocumentSheet}
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
                useAction: DHSheetV2.#useAction,
                toggleEffect: DHSheetV2.#toggleEffect,
                toggleExtended: DHSheetV2.#toggleExtended,
            },
            contextMenus: [{
                handler: DHSheetV2.#getEffectContextOptions,
                selector: '[data-item-uuid][data-type="effect"]',
                options: {
                    parentClassHooks: false,
                    fixed: true
                },
            },
            {
                handler: DHSheetV2.#getActionContextOptions,
                selector: '[data-item-uuid][data-type="action"]',
                options: {
                    parentClassHooks: false,
                    fixed: true
                }
            }],
            dragDrop: [],
            tagifyConfigs: []
        };

        /* -------------------------------------------- */

        /**@inheritdoc */
        _attachPartListeners(partId, htmlElement, options) {
            super._attachPartListeners(partId, htmlElement, options);
            this._dragDrop.forEach(d => d.bind(htmlElement));
        }
        /**@inheritdoc */
        async _onFirstRender(context, options) {
            await super._onFirstRender(context, options);
            if (!!this.options.contextMenus.length) this._createContextMenus();
        }

        /**@inheritdoc */
        async _onRender(context, options) {
            await super._onRender(context, options);
            this._createTagifyElements(this.options.tagifyConfigs);
        }

        /* -------------------------------------------- */
        /*  Sync Parts                                  */
        /* -------------------------------------------- */

        /**@inheritdoc */
        _syncPartState(partId, newElement, priorElement, state) {
            super._syncPartState(partId, newElement, priorElement, state);
            for (const el of priorElement.querySelectorAll(".extensible.extended")) {
                const { actionId, itemUuid } = el.parentElement.dataset;
                const selector = `${actionId ? `[data-action-id="${actionId}"]` : `[data-item-uuid="${itemUuid}"]`} .extensible`;
                const newExtensible = newElement.querySelector(selector);

                if (!newExtensible) continue;
                newExtensible.classList.add("extended");
                const descriptionElement = newExtensible.querySelector('.invetory-description');
                if (descriptionElement) {
                    this.#prepareInventoryDescription(newExtensible, descriptionElement);
                }
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
        _onDragStart(event) { }

        /**
         * Handle drop event.
         * @param {DragEvent} event
         * @protected
         */
        _onDrop(event) { }

        /* -------------------------------------------- */
        /*  Context Menu                                */
        /* -------------------------------------------- */

        _createContextMenus() {
            for (const config of this.options.contextMenus) {
                const { handler, selector, options } = config;
                this._createContextMenu(handler.bind(this), selector, options);
            }
        }

        /* -------------------------------------------- */

        /**
         * Get the set of ContextMenu options for DomainCards.
         * @returns {import('@client/applications/ux/context-menu.mjs').ContextMenuEntry[]} - The Array of context options passed to the ContextMenu instance
         * @this {CharacterSheet}
         * @protected
         */
        static #getEffectContextOptions() {
            /**@type {import('@client/applications/ux/context-menu.mjs').ContextMenuEntry[]} */
            const options = [
                {
                    name: 'disableEffect',
                    icon: 'fa-solid fa-lightbulb',
                    condition: target => !getDocFromElement(target).disabled,
                    callback: target => getDocFromElement(target).update({ disabled: true })
                },
                {
                    name: 'enableEffect',
                    icon: 'fa-regular fa-lightbulb',
                    condition: target => getDocFromElement(target).disabled,
                    callback: target => getDocFromElement(target).update({ disabled: false })
                },
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
            const getAction = (target) => {
                const { actionId } = target.closest('[data-action-id]').dataset;
                const { actions, attack } = this.document.system;
                return attack?.id === actionId ? attack : actions?.find(a => a.id === actionId);
            };

            const options = [
                {
                    name: 'DAGGERHEART.APPLICATIONS.ContextMenu.useItem',
                    icon: 'fa-solid fa-burst',
                    condition: this.document instanceof foundry.documents.Actor ||
                        (this.document instanceof foundry.documents.Item && this.document.parent),
                    callback: (target, event) => getAction(target).use(event),
                },
                {
                    name: 'DAGGERHEART.APPLICATIONS.ContextMenu.sendToChat',
                    icon: 'fa-solid fa-message',
                    callback: (target) => getAction(target).toChat(this.document.id),
                },
                {
                    name: 'CONTROLS.CommonEdit',
                    icon: 'fa-solid fa-pen-to-square',
                    callback: (target) => new DHActionConfig(getAction(target)).render({ force: true })
                },
                {
                    name: 'CONTROLS.CommonDelete',
                    icon: 'fa-solid fa-trash',
                    condition: (target) => {
                        const { actionId } = target.closest('[data-action-id]').dataset;
                        const { attack } = this.document.system;
                        return attack?.id !== actionId
                    },
                    callback: async (target) => {
                        const action = getAction(target)
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

                        return this.document.update({
                            'system.actions': this.document.system.actions.filter((a) => a.id !== action.id)
                        });
                    }
                }
            ].map(option => ({
                ...option,
                icon: `<i class="${option.icon}"></i>`
            }));

            return options;
        }

        /**
         * Get the set of ContextMenu options.
         * @returns {import('@client/applications/ux/context-menu.mjs').ContextMenuEntry[]} - The Array of context options passed to the ContextMenu instance
         */
        _getContextMenuCommonOptions({ usable = false, toChat = false, deletable = true }) {
            const options = [
                {
                    name: 'CONTROLS.CommonEdit',
                    icon: 'fa-solid fa-pen-to-square',
                    callback: target => getDocFromElement(target).sheet.render({ force: true })
                },
            ];

            if (usable) options.unshift({
                name: 'DAGGERHEART.APPLICATIONS.ContextMenu.useItem',
                icon: 'fa-solid fa-burst',
                callback: (target, event) => getDocFromElement(target).use(event),
            });

            if (toChat) options.unshift({
                name: 'DAGGERHEART.APPLICATIONS.ContextMenu.sendToChat',
                icon: 'fa-solid fa-message',
                callback: (target) => getDocFromElement(target).toChat(this.document.id),
            });

            if (deletable) options.push({
                name: 'CONTROLS.CommonDelete',
                icon: 'fa-solid fa-trash',
                callback: (target, event) => {
                    const doc = getDocFromElement(target);
                    if (event.shiftKey) return doc.delete();
                    else return doc.deleteDialog();
                }
            })

            return options.map(option => ({
                ...option,
                icon: `<i class="${option.icon}"></i>`
            }))
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
            return context;
        }

        /* -------------------------------------------- */
        /*  Prepare Descriptions                        */
        /* -------------------------------------------- */

        /**
         * Prepares and enriches an inventory item or action description for display.
         * @param {HTMLElement} extensibleElement - The parent element containing the description.
         * @param {HTMLElement} descriptionElement - The element where the enriched description will be rendered.
         * @returns {Promise<void>}
         */
        async #prepareInventoryDescription(extensibleElement, descriptionElement) {
            const parent = extensibleElement.closest('[data-item-uuid], [data-action-id]');
            const { actionId, itemUuid } = parent?.dataset || {};
            if (!actionId && !itemUuid) return;

            const doc = itemUuid
                ? getDocFromElement(extensibleElement)
                : this.document.system.attack?.id === actionId
                    ? this.document.system.attack
                    : this.document.system.actions?.find(a => a.id === actionId);
            if (!doc) return;

            const description = doc.system?.description ?? doc.description;
            const isAction = !!actionId;
            descriptionElement.innerHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(description, {
                relativeTo: isAction ? doc.parent : doc,
                rollData: doc.getRollData?.(),
                secrets: isAction ? doc.parent.isOwner : doc.isOwner
            });
        }

        /* -------------------------------------------- */
        /*  Application Clicks Actions                  */
        /* -------------------------------------------- */

        /**
         * Create an embedded document.
         * @type {ApplicationClickAction}
         */
        static async #createDoc(event, target) {
            const { documentClass, type, inVault, disabled } = target.dataset;
            const parentIsItem = this.document.documentName === 'Item';
            const parent = parentIsItem && documentClass === 'Item' ? null : this.document;

            if (type === 'action') {
                const { type: actionType } = await foundry.applications.api.DialogV2.input({
                    window: { title: 'Select Action Type' },
                    content: await foundry.applications.handlebars.renderTemplate(
                        'systems/daggerheart/templates/actionTypes/actionType.hbs',
                        { types: CONFIG.DH.ACTIONS.actionTypes }
                    ),
                    ok: {
                        label: game.i18n.format('DOCUMENT.Create', {
                            type: game.i18n.localize('DAGGERHEART.GENERAL.Action.single')
                        }),
                    }
                }) ?? {};
                if (!actionType) return;
                const cls = game.system.api.models.actions.actionsTypes[actionType]
                const action = new cls({
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
                return action;

            } else {
                const cls = getDocumentClass(documentClass);
                const data = {
                    name: cls.defaultName({ type, parent }),
                    type,
                }
                if (inVault) data["system.inVault"] = true;
                if (disabled) data.disabled = true;

                const doc = await cls.create(data, { parent, renderSheet: !event.shiftKey });
                if (parentIsItem && type === 'feature') {
                    await this.document.update({
                        'system.features': this.document.system.toObject().features.concat(doc.uuid)
                    });
                }
                return doc;
            }

        }

        /**
         * Renders an embedded document.
         * @type {ApplicationClickAction}
         */
        static #editDoc(_event, target) {
            const doc = getDocFromElement(target);
            if (doc) return doc.sheet.render({ force: true });

            // TODO: REDO this
            const { actionId } = target.closest('[data-action-id]').dataset;
            const { actions, attack } = this.document.system;
            const action = attack?.id === actionId ? attack : actions?.find(a => a.id === actionId);
            new DHActionConfig(action).render({ force: true })
        }

        /**
         * Delete an embedded document.
         * @type {ApplicationClickAction}
         */
        static async #deleteDoc(event, target) {
            const doc = getDocFromElement(target);

            if (doc) {
                if (event.shiftKey) return doc.delete()
                else return await doc.deleteDialog()
            }

            // TODO: REDO this
            const { actionId } = target.closest('[data-action-id]').dataset;
            const { actions, attack } = this.document.system;
            if (attack?.id === actionId) return;
            const action = actions.find(a => a.id === actionId);

            if (!event.shiftKey) {
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
            }

            return await this.document.update({
                'system.actions': actions.filter((a) => a.id !== action.id)
            });
        }

        /**
         * Send item to Chat
         * @type {ApplicationClickAction}
         */
        static async #toChat(_event, target) {
            let doc = getDocFromElement(target);

            // TODO: REDO this
            if (!doc) {
                const { actionId } = target.closest('[data-action-id]').dataset;
                const { actions, attack } = this.document.system;
                doc = attack?.id === actionId ? attack : actions?.find(a => a.id === actionId);
            }
            return doc.toChat(this.document.id);
        }

        /**
         * Use a item
         * @type {ApplicationClickAction}
         */
        static async #useItem(event, target) {
            let doc = getDocFromElement(target);
            // TODO: REDO this
            if (!doc) {
                const { actionId } = target.closest('[data-action-id]').dataset;
                const { actions, attack } = this.document.system;
                doc = attack?.id === actionId ? attack : actions?.find(a => a.id === actionId);
                if(this.document instanceof foundry.documents.Item && !this.document.parent) return;
            }

            await doc.use(event);
        }

        /**
         * Use a item
         * @type {ApplicationClickAction}
         */
        static async #useAction(event, target) {
            const doc = getDocFromElement(target);
            const { actionId } = target.closest('[data-action-id]').dataset;
            const { actions, attack } = doc.system;
            const action = attack?.id === actionId ? attack : actions?.find(a => a.id === actionId);
            await action.use(event);
        }


        /**
         * Toggle a ActiveEffect
         * @type {ApplicationClickAction}
         */
        static async #toggleEffect(_, target) {
            const doc = getDocFromElement(target);
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
            const t = extensible?.classList.toggle('extended');

            const descriptionElement = extensible?.querySelector('.invetory-description');
            if (t && !!descriptionElement) this.#prepareInventoryDescription(extensible, descriptionElement);
        }

    }

    return DHSheetV2;
}
