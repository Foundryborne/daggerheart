import { BasePseudoDocument } from "../pseudo-documents/_types";
export default class PseudoDocumentsField extends foundry.data.fields.TypedObjectField {
    constructor(model, options = {}, context = {}) {
        options.validateKey ||= ((key) => foundry.data.validators.isValidId(key));
        if (!(model instanceof BasePseudoDocument)) throw new Error("The model must be a PseudoDocument");
        const field = new foundry.data.fields.EmbeddedDataField(model);
        super(field, options, context);
    }

    /** @inheritdoc */
    static get _defaults() {
        return Object.assign(super._defaults, {
            max: Infinity
        });
    }

    /** @override */
    _validateType(value, options = {}) {
        if (Object.keys(value).length > this.max) throw new Error(`cannot have more than ${this.max} elements`);
        return super._validateType(value, options);
    }
}