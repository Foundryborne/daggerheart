export default class ItemLinksField extends foundry.data.fields.TypedObjectField {
    /**
     * @param {DataFieldOptions} [options]    Options which configure the behavior of the field.
     * @param {DataFieldContext} [context]    Additional context which describes the field
     */
    constructor(options, context) {
        super(
            new foundry.data.fields.StringField({
                choices: CONFIG.DH.ITEM.itemLinkTypes,
                nullable: true,
                initial: null
            }),
            options,
            context
        );
    }

    /** @inheritDoc */
    static get _defaults() {
        return foundry.utils.mergeObject(super._defaults, { validateKey: this.validateKey });
    }

    /**
     * @param {Object} [value]    The candidate object to be added.
     */
    static validateKey(value) {
        const parsed = foundry.utils.parseUuid(value);
        if (!parsed || parsed.type !== foundry.documents.Item.documentName) return false;
        if (!foundry.data.validators.isValidId(parsed.documentId)) return false;
        return true;
    }

    /**@inheritdoc */
    _cast(value) {
        value = super._cast(value);
        return foundry.utils.flattenObject(value);
    }
}
