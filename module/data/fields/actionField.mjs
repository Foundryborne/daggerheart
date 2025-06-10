import { actionsTypes } from "../action/_module.mjs";

// Temporary Solution
export default class ActionField extends foundry.data.fields.EmbeddedDataField {
    /** @override */
    initialize(value, model, options={}) {
        this.model = actionsTypes[value?.type] ?? actionsTypes.attack;
        this.fields = this._initialize(this.model.defineSchema());
        return super.initialize(value, model, options)
    }
}