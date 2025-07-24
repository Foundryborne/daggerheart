import BaseDataItem from './base.mjs';
import { ActionField } from '../fields/actionField.mjs';

export default class DHMiscellaneous extends BaseDataItem {
    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Item.miscellaneous',
            type: 'miscellaneous',
            hasDescription: true,
            isQuantifiable: true,
            isInventoryItem: true,
            hasActions: true
        });
    }

    /** @inheritDoc */
    static defineSchema() {
        return {
            ...super.defineSchema()
        };
    }
}
