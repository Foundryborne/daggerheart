/**
 * A subclass of {@link foundry.data.fields.DocumentUUIDField} to allow selecting a foreign document reference
 * that resolves to either the document, the index(for items in compenidums) or the UUID string.
 */
export default class ForeignDocumentUUIDField extends foundry.data.fields.DocumentUUIDField {
    /**
     * @param {foundry.data.types.DocumentUUIDFieldOptions} [options] Options which configure the behavior of the field
     * @param {foundry.data.types.DataFieldContext} [context]    Additional context which describes the field
     */
    constructor(options, context) {
        super(options, context);
    }

    /** @inheritdoc */
    static get _defaults() {
        return foundry.utils.mergeObject(super._defaults, {
            nullable: true,
            readonly: false,
            idOnly: false
        });
    }

    /**@override */
    initialize(value, _model, _options = {}) {
        if (this.idOnly) return value;
        return () => {
            try {
                const doc = fromUuidSync(value);
                return doc;
            } catch (error) {
                console.error(error);
                return value ?? null;
            }
        };
    }

    /**@override */
    toObject(value) {
        return value?.uuid ?? value;
    }
}
