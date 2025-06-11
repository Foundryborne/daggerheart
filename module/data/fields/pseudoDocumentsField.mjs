import PseudoDocument from '../pseudo-documents/base/pseudoDocument.mjs';

const { TypedObjectField, TypedSchemaField } = foundry.data.fields;

/**
 * @typedef _PseudoDocumentsFieldOptions
 * @property {Number} [max] - The maximum amount of elements (default: `Infinity`)
 * @property {String[]} [validTypes] - Allowed pseudo-documents types (default: `[]`)
 * @property {Function} [validateKey] - callback for validate keys of the object;

 * @typedef {foundry.data.types.DataFieldOptions & _PseudoDocumentsFieldOptions} PseudoDocumentsFieldOptions
 */
export default class PseudoDocumentsField extends TypedObjectField {
    /**
     * @param {PseudoDocument} model - The PseudoDocument of each entry in this collection.
     * @param {PseudoDocumentsFieldOptions} [options] - Options which configure the behavior of the field
     * @param {foundry.data.types.DataFieldContext} [context] - Additional context which describes the field
     */
    constructor(model, options = {}, context = {}) {
        options.validateKey ||= key => foundry.data.validators.isValidId(key);
        if (!foundry.utils.isSubclass(model, PseudoDocument)) throw new Error('The model must be a PseudoDocument');

        const allTypes = model.TYPES;

        const filteredTypes = options.validTypes
            ? Object.fromEntries(
                Object.entries(allTypes).filter(([key]) => options.validTypes.includes(key))
            )
            : allTypes;

        const field = new TypedSchemaField(filteredTypes);
        super(field, options, context);
    }

    /** @inheritdoc */
    static get _defaults() {
        return Object.assign(super._defaults, {
            max: Infinity,
            validTypes: []
        });
    }

    /** @override */
    _validateType(value, options = {}) {
        if (Object.keys(value).length > this.max) throw new Error(`cannot have more than ${this.max} elements`);
        return super._validateType(value, options);
    }

    /** @override */
    initialize(value, model, options = {}) {
        if (!value) return;
        value = super.initialize(value, model, options);
        const collection = new foundry.utils.Collection(Object.values(value).map(d => [d._id, d]));
        return collection;
    }
}
