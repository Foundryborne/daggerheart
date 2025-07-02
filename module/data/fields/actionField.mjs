// import { actionsTypes } from '../action/_module.mjs';

// Temporary Solution
export default class ActionField extends foundry.data.fields.ObjectField {
    getModel(value) {
        return game.system.api.models.actionsTypes[value.type] ?? game.system.api.models.actionsTypes.attack;
    }

    /* -------------------------------------------- */

    /** @override */
    _cleanType(value, options) {
        if (!(typeof value === 'object')) value = {};

        const cls = this.getModel(value);
        if (cls) return cls.cleanData(value, options);
        return value;
    }

    /* -------------------------------------------- */

    /** @override */
    initialize(value, model, options = {}) {
        const cls = this.getModel(value);
        if (cls) return new cls(value, { parent: model, ...options });
        return foundry.utils.deepClone(value);
    }

    /* -------------------------------------------- */

    /**
     * Migrate this field's candidate source data.
     * @param {object} sourceData  Candidate source data of the root model.
     * @param {any} fieldData      The value of this field within the source data.
     */
    migrateSource(sourceData, fieldData) {
        const cls = this.getModel(fieldData);
        if (cls) cls.migrateDataSafe(fieldData);
    }
}
