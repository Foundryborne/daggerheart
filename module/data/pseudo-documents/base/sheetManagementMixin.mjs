import BasePseudoDocument from './base.mjs';
const { ApplicationV2 } = foundry.applications.api;

/**
 * A mixin that adds sheet management capabilities to pseudo-documents
 * @template {typeof BasePseudoDocument} T
 * @param {T} Base
 * @returns {T & typeof PseudoDocumentWithSheets}
 */
export default function SheetManagementMixin(Base) {
    class PseudoDocumentWithSheets extends Base {
        /**
         * Reference to the sheet of this pseudo-document.
         * @type {ApplicationV2|null}
         */
        get sheet() {
            if (this._sheet) return this._sheet;
            const cls = this.constructor.metadata.sheetClass ?? ApplicationV2;
            
            if (!foundry.utils.isSubclass(cls, ApplicationV2)) {
                return void ui.notifications.error(
                    'Daggerheart | Error on PseudoDocument | sheetClass must be ApplicationV2'
                );
            }

            const sheet = new cls({ document: this });
            this._sheet = sheet;
            return sheet;
        }

        /* -------------------------------------------- */
        /*  Static Properties                           */
        /* -------------------------------------------- */

        /**
         * Set of apps what should be re-render.
         * @type {Set<ApplicationV2>}
         * @internal
         */
        _apps = new Set();

        /* -------------------------------------------- */

        /**
         * Existing sheets of a specific type for a specific document.
         * @type {ApplicationV2 | null}
         */
        _sheet = null;

        /* -------------------------------------------- */
        /*  Display Methods                             */
        /* -------------------------------------------- */

        /**
         * Render all the Application instances which are connected to this PseudoDocument.
         * @param {ApplicationRenderOptions} [options]  Rendering options.
         */
        render(options) {
            for (const app of this._apps ?? []) {
                app.render({ window: { title: app.title }, ...options });
            }
        }

        /* -------------------------------------------- */

        /**
         * Register an application to respond to updates to a certain document.
         * @param {ApplicationV2} app     Application to update.
         * @internal
         */
        _registerApp(app) {
            this._apps.add(app);
        }

        /* -------------------------------------------- */

        /**
         * Remove an application from the render registry.
         * @param {ApplicationV2} app     Application to stop watching.
         */
        _unregisterApp(app) {
            this._apps.delete(app);
        }

        /* -------------------------------------------- */
        /*  Drag and Drop                               */
        /* -------------------------------------------- */

        /**
         * Serialize salient information for this PseudoDocument when dragging it.
         * @returns {object}  An object of drag data.
         */
        toDragData() {
            const dragData = { type: this.documentName, data: this.toObject() };
            if (this.id) dragData.uuid = this.uuid;
            return dragData;
        }

        /* -------------------------------------------- */
        /*  Dialog Methods                              */
        /* -------------------------------------------- */

        /**
         * Spawn a dialog for creating a new PseudoDocument.
         * @param {object} [data]  Data to pre-populate the document with.
         * @param {object} context
         * @param {foundry.documents.Item} context.parent        A parent for the document.
         * @param {string[]|null} [context.types]  A list of types to restrict the choices to, or null for no restriction.
         * @returns {Promise<BasePseudoDocument|null>}
         */
        static async createDialog(data = {}, { parent, types = null, ...options } = {}) {
            // TODO
        }

        /**
         * Present a Dialog form to confirm deletion of this PseudoDocument.
         * @param {object} [options] - Additional options passed to `DialogV2.confirm`;
         * @returns {Promise<foundry.abstract.Document>}  A Promise which resolves to the deleted PseudoDocument.
         */
        async deleteDialog(options = {}) {
            const type = game.i18n.localize(this.constructor.metadata.label);
            const content = options.content ?? `<p>
            <strong>${game.i18n.localize("AreYouSure")}</strong>
            ${game.i18n.format("SIDEBAR.DeleteWarning", { type })}
            </p>`;

            return foundry.applications.api.DialogV2.confirm({
                content,
                yes: { callback: () => this.delete(operation) },
                window: {
                    icon: "fa-solid fa-trash",
                    title: `${game.i18n.format("DOCUMENT.Delete", { type })}: ${this.name}`
                },
                ...options
            });
        }

        /**
         * Gets the default new name for a Document
         * @param {object} collection - Collection of Documents
         * @returns {string}
         */
        static defaultName(collection) {
            const documentName = this.metadata.name;
            const takenNames = new Set();
            for (const document of collection) takenNames.add(document.name);

            const config = CONFIG.daggerheart.pseudoDocuments[documentName];
            const baseName = game.i18n.localize(config.label);
            let name = baseName;
            let index = 1;
            while (takenNames.has(name)) name = `${baseName} (${++index})`;
            return name;
        }
    }

    return PseudoDocumentWithSheets;
}
