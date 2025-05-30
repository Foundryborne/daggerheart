import BaseDataItem from './base.mjs';

export default class DHMiscellaneous extends BaseDataItem {
    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: "TYPES.Item.miscellaneous",
            type: "miscellaneous",
            hasDescription: true,
            isQuantifiable: true,
        });
    }

    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
        };
    }
}
