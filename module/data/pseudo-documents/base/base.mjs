/**
 * @typedef {object} PseudoDocumentMetadata
 * @property {string} name - The document name of this pseudo-document
 * @property {Record<string, string>} embedded - Record of document names and their collection paths
 * @property {typeof foundry.applications.api.ApplicationV2} [sheetClass] - The class used to render this pseudo-document
 * @property {string} defaultArtwork - The default image used for newly created documents
 */

/**
 * @class Base class for pseudo-documents
 * @extends {foundry.abstract.DataModel}
 */
export default class BasePseudoDocument extends foundry.abstract.DataModel {
    /**
     * Pseudo-document metadata.
     * @returns {PseudoDocumentMetadata}
     */
    static get metadata() {
        return {
            name: '',
            embedded: {},
            defaultArtwork: foundry.documents.Item.DEFAULT_ICON,
            sheetClass: CONFIG.daggerheart.pseudoDocuments.sheetClass,
        };
    }

    /** @override */
    static LOCALIZATION_PREFIXES = ['DOCUMENT'];

    /** @inheritdoc */
    static defineSchema() {
        const { fields } = foundry.data;

        return {
            _id: new fields.DocumentIdField({ initial: () => foundry.utils.randomID() }),
            name: new fields.StringField({ required: true, blank: false, textSearch: true }),
            img: new fields.FilePathField({ categories: ['IMAGE'], initial: this.metadata.defaultArtwork }),
            description: new fields.HTMLField({ textSearch: true })
        };
    }

    /* -------------------------------------------- */
    /*  Instance Properties                         */
    /* -------------------------------------------- */

    /**
     * The id of this pseudo-document.
     * @type {string}
     */
    get id() {
        return this._id;
    }

    /* -------------------------------------------- */

    /**
     * The uuid of this document.
     * @type {string}
     */
    get uuid() {
        let parent = this.parent;
        while (!(parent instanceof BasePseudoDocument) && !(parent instanceof foundry.abstract.Document))
            parent = parent.parent;
        return [parent.uuid, this.constructor.metadata.name, this.id].join('.');
    }

    /* -------------------------------------------- */

    /**
     * The parent document of this pseudo-document.
     * @type {foundry.abstract.Document}
     */
    get document() {
        let parent = this;
        while (!(parent instanceof foundry.abstract.Document)) parent = parent.parent;
        return parent;
    }

    /* -------------------------------------------- */

    /**
     * Item to which this PseudoDocument belongs, if applicable.
     * @type {foundry.documents.Item|null}
     */
    get item() {
        return this.parent?.parent instanceof Item ? this.parent.parent : null;
    }

    /* -------------------------------------------- */

    /**
     * Actor to which this PseudoDocument's item belongs, if the item is embedded.
     * @type {foundry.documents.Actor|null}
     */
    get actor() {
        return this.item?.parent ?? null;
    }

    /* -------------------------------------------- */

    /**
     * The property path to this pseudo document relative to its parent document.
     * @type {string}
     */
    get fieldPath() {
        const fp = this.schema.fieldPath;
        let path = fp.slice(0, fp.lastIndexOf('element') - 1);

        if (this.parent instanceof BasePseudoDocument) {
            path = [this.parent.fieldPath, this.parent.id, path].join('.');
        }

        return path;
    }

    /* -------------------------------------------- */
    /*  Embedded Document Methods                   */
    /* -------------------------------------------- */

    /**
     * Retrieve an embedded pseudo-document.
     * @param {string} embeddedName         The document name of the embedded pseudo-document.
     * @param {string} id                   The id of the embedded pseudo-document.
     * @param {object} [options]            Retrieval options.
     * @param {boolean} [options.strinct]   Throw an error if the embedded pseudo-document does not exist?
     * @returns {PseudoDocument|null}
     */
    getEmbeddedDocument(embeddedName, id, { strict = false } = {}) {
        const embeds = this.constructor.metadata.embedded ?? {};
        if (embeddedName in embeds) {
            return foundry.utils.getProperty(this, embeds[embeddedName]).get(id, { strict }) ?? null;
        }
        return null;
    }

    /* -------------------------------------------- */
    /*  CRUD Operations                             */
    /* -------------------------------------------- */

    /**
     * Does this pseudo-document exist in the document's source?
     * @type {boolean}
     */
    get isSource() {
        const source = foundry.utils.getProperty(this.document._source, this.fieldPath);
        if (foundry.utils.getType(source) !== 'Object') {
            throw new Error('Source is not an object!');
        }
        return this.id in source;
    }

    /**
     * Create a new instance of this pseudo-document.
     * @param {object} [data]                                 The data used for the creation.
     * @param {object} operation                              The context of the update operation.
     * @param {foundry.abstract.Document} operation.parent    The parent of this document.
     * @returns {Promise<foundry.abstract.Document>}          A promise that resolves to the updated document.
     */
    static async create(data = {}, { parent, ...operation } = {}) {
        if (!parent) {
            throw new Error('A parent document must be specified for the creation of a pseudo-document!');
        }
        const id =
            operation.keepId && foundry.data.validators.isValidId(data._id) ? data._id : foundry.utils.randomID();

        const fieldPath = parent.system.constructor.metadata.embedded?.[this.metadata.name];
        if (!fieldPath) {
            throw new Error(
                `A ${parent.documentName} of type '${parent.type}' does not support ${this.metadata.name}!`
            );
        }

        const update = { [`system.${fieldPath}.${id}`]: { ...data, _id: id } };
        const updatedParent = await parent.update(update, operation);
        return foundry.utils.getProperty(updatedParent, `system.${fieldPath}.${id}`);
    }

    /**
     * Delete this pseudo-document.
     * @param {object} [operation]                      The context of the operation.
     * @returns {Promise<foundry.abstract.Document>}    A promise that resolves to the updated document.
     */
    async delete(operation = {}) {
        if (!this.isSource) throw new Error('You cannot delete a non-source pseudo-document!');
        const update = { [`${this.fieldPath}.-=${this.id}`]: null };
        return this.document.update(update, operation);
    }

    /**
     * Duplicate this pseudo-document.
     * @returns {Promise<foundry.abstract.Document>}    A promise that resolves to the updated document.
     */
    async duplicate() {
        if (!this.isSource) throw new Error('You cannot duplicate a non-source pseudo-document!');
        const docData = foundry.utils.mergeObject(this.toObject(), {
            name: game.i18n.format('DOCUMENT.CopyOf', { name: this.name })
        });
        return this.constructor.create(docData, { parent: this.document });
    }

    /**
     * Update this pseudo-document.
     * @param {object} [change]                         The change to perform.
     * @param {object} [operation]                      The context of the operation.
     * @returns {Promise<foundry.abstract.Document>}    A promise that resolves to the updated document.
     */
    async update(change = {}, operation = {}) {
        if (!this.isSource) throw new Error('You cannot update a non-source pseudo-document!');
        const path = [this.fieldPath, this.id].join('.');
        const update = { [path]: change };
        return this.document.update(update, operation);
    }
}
