/**
 * @typedef {Object} ItemDataModelMetadata
 * @property {String} type - System type that this type data model represents
 * @property {Boolean} hasDescription
 */

const fields = foundry.data.fields;

export default class BaseDataItem extends foundry.abstract.TypeDataModel {
  /** @returns {ItemDataModelMetadata}*/
  static get metadata() {
    return {
      label: "Base Item",
      type: "base",
      hasDescription: false,
      isQuantifiable: false
    };
  }

  /** @inheritDoc */
  static defineSchema() {
    const schema = {};

    if (this.metadata.hasDescription)
      schema.description = new fields.HTMLField({ required: true, nullable: true });

    if (this.metadata.isQuantifiable)
      schema.quantity = new fields.NumberField({ integer: true, initial: 1, min: 0, required: true });

    return schema;
  }

  /**
   * Obtain a data object used to evaluate any dice rolls associated with this Item
   * @param {object} [options]
   * @returns {object}
   */
  getRollData(options = {}) {
    const actorRollData = this.parent.actor?.getRollData() ?? {};
    const data = { ...actorRollData, item: { ...this } };
    return data;
  }
}