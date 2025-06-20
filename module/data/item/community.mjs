import ActionField from '../fields/actionField.mjs';
import BaseDataItem from './base.mjs';

export default class DHCommunity extends BaseDataItem {
    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Item.community',
            type: 'community',
            hasDescription: true
        });
    }

    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            actions: new fields.ArrayField(new ActionField())
        };
    }
}
