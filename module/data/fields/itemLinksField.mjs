export default class ItemLinksField extends foundry.data.fields.TypedObjectField {
    /**
     * @param {DataFieldOptions} [options]    Options which configure the behavior of the field.
     * @param {DataFieldContext} [context]    Additional context which describes the field
     */
    constructor(options, context) {
        super(new foundry.data.fields.SetField(new foundry.data.fields.DocumentUUIDField()), options, context);
    }

    /** @inheritDoc */
    static get _defaults() {
        return foundry.utils.mergeObject(super._defaults, { validateKey: this.validateKey });
    }

    /**
     * @param {Object} [value]    The candidate object to be added.
     */
    static validateKey(value) {
        return Boolean(CONFIG.DH.ITEM.itemLinkTypes[value]);
    }
}
