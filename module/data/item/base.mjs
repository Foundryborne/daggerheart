/**
 * Describes metadata about the item data model type
 * @typedef {Object} ItemDataModelMetadata
 * @property {string} label - A localizable label used on application.
 * @property {string} type - The system type that this data model represents.
 * @property {boolean} hasDescription - Indicates whether items of this type have description field
 * @property {boolean} isQuantifiable - Indicates whether items of this type have quantity field
 */

const fields = foundry.data.fields;

export default class BaseDataItem extends foundry.abstract.TypeDataModel {
    /** @returns {ItemDataModelMetadata}*/
    static get metadata() {
        return {
            label: 'Base Item',
            type: 'base',
            hasDescription: false,
            isQuantifiable: false
        };
    }

    /** @inheritDoc */
    static defineSchema() {
        const schema = {};

        if (this.metadata.hasDescription) schema.description = new fields.HTMLField({ required: true, nullable: true });

        if (this.metadata.isQuantifiable)
            schema.quantity = new fields.NumberField({ integer: true, initial: 1, min: 0, required: true });

        return schema;
    }

    /**
     * Convenient access to the item's actor, if it exists.
     * @returns {foundry.documents.Actor | null}
     */
    get actor() {
        return this.parent.actor;
    }

    /**
     * Obtain a data object used to evaluate any dice rolls associated with this Item Type
     * @param {object} [options] - Options which modify the getRollData method.
     * @returns {object}
     */
    getRollData(options = {}) {
        const actorRollData = this.actor?.getRollData() ?? {};
        const data = { ...actorRollData, item: { ...this } };
        return data;
    }
}
