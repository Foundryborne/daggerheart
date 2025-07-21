export default class ItemLinksField extends foundry.data.fields.TypedObjectField {
    /**
     * @param {DataFieldOptions} [options]    Options which configure the behavior of the field.
     * @param {DataFieldContext} [context]    Additional context which describes the field
     */
    constructor(options, context) {
        super(
            new foundry.data.fields.StringField({
                choices: CONFIG.DH.ITEM.featureSubTypes,
                nullable: true,
                initial: null
            }),
            options,
            context
        );
    }

    /** @inheritDoc */
    static get _defaults() {
        return mergeObject(super._defaults, { validateKey: this.validateKey });
    }

    /**
     * @param {Object} [value]    The candidate object to be added.
     */
    static validateKey(value) {
        return true;
        const parsed = foundry.utils.parseUuid(value);
        if (!parsed || parsed.type !== CONFIG.Item.documentClass.documentName) return false;
        if (!foundry.packages.BasePackage.validateId(parsed.documentId)) return false;
    }
}
