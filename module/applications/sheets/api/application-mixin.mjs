const { HandlebarsApplicationMixin } = foundry.applications.api;
import { tagifyElement } from '../../../helpers/utils.mjs';

/**
 * @typedef {object} DragDropConfig
 * @property {string} [dragSelector] - A CSS selector that identifies draggable elements.
 * @property {string} [dropSelector] - A CSS selector that identifies drop targets.
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
 *
 * @typedef {import("@client/applications/api/handlebars-application.mjs").HandlebarsRenderOptions} HandlebarsRenderOptions
 * @typedef {foundry.applications.types.ApplicationConfiguration & HandlebarsRenderOptions & { dragDrop?: DragDropConfig[], tagifyConfigs?: TagifyConfig[]  }} DHSheetV2Configuration
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
            position: {
                width: 480,
                height: 'auto'
            },
            actions: {
                addEffect: DHSheetV2.#addEffect,
                editEffect: DHSheetV2.#editEffect,
                removeEffect: DHSheetV2.#removeEffect
            },
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
        async _onRender(context, options) {
            await super._onRender(context, options);
            this._createTagifyElements(this.options.tagifyConfigs);
        }

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
                    drop: this._onDrop.bind(this)
                };
                return new foundry.applications.ux.DragDrop.implementation(d);
            });
        }

        /**
         * Handle drop event.
         * @param {DragEvent} event
         * @protected
         */
        _onDrop(event) { }

        /* -------------------------------------------- */
        /*  Prepare Context                             */
        /* -------------------------------------------- */

        /**
         * Prepare the template context.
         * @param {object} options
         * @param {string} [objectPath='document']
         * @returns {Promise<object>}
         * @inheritdoc
         */
        async _prepareContext(options, objectPath = 'document') {
            const context = await super._prepareContext(options);
            context.config = CONFIG.daggerheart;
            context.source = this[objectPath];
            context.fields = this[objectPath].schema.fields;
            context.systemFields = this[objectPath].system ? this[objectPath].system.schema.fields : {};
            return context;
        }

        /* -------------------------------------------- */
        /*  Application Clicks Actions                  */
        /* -------------------------------------------- */

        /**
         * Renders an ActiveEffect's sheet sheet.
         * @param {PointerEvent} event - The originating click event
         * @param {HTMLElement} button - The capturing HTML element which defines the [data-action="removeAction"]
         */
        static async #addEffect() {
            const cls = foundry.documents.ActiveEffect;
            await cls.create(
                {
                    name: game.i18n.format('DOCUMENT.New', { type: game.i18n.localize(cls.metadata.label) })
                },
                { parent: this.document }
            );
        }

        /**
         * Renders an ActiveEffect's sheet sheet.
         * @param {PointerEvent} event - The originating click event
         * @param {HTMLElement} button - The capturing HTML element which defines the [data-action="removeAction"]
         */
        static async #editEffect(_event, button) {
            const effect = this.document.effects.get(button.dataset.effect);
            effect.sheet.render({ force: true });
        }

        /**
         * Delete an ActiveEffect from the item.
         * @param {PointerEvent} _event - The originating click event
         * @param {HTMLElement} button - The capturing HTML element which defines the [data-action="removeAction"]
         */
        static async #removeEffect(_event, button) {
            await this.document.effects.get(button.dataset.effect).delete();
        }
    }

    return DHSheetV2;
}
