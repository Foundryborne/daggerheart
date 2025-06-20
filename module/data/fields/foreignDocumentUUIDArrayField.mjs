import ForeignDocumentUUIDField from './foreignDocumentUUIDField.mjs';
/**
 * A subclass of {@link foundry.data.fields.ArrayField} that defines an array of foreign document UUID references.
 */
export default class ForeignDocumentUUIDArrayField extends foundry.data.fields.ArrayField {
    /**
     * @param {foundry.data.types.DocumentUUIDFieldOptions} [fieldOption] - Options to configure each individual ForeignDocumentUUIDField.
     * @param {foundry.data.types.ArrayFieldOptions} [options] - Options to configure the array behavior
     * @param {foundry.data.types.DataFieldContext} [context] -  Optional context for schema processing
     */
    constructor(fieldOption = {}, options = {}, context = {}) {
        super(new ForeignDocumentUUIDField(fieldOption), options, context);
    }

    /** @inheritdoc */
    initialize(value, model, options = {}) {
        const v = super.initialize(value, model, options);
        return () => v.map(entry => (typeof entry === 'function' ? entry() : entry));
    }
}
