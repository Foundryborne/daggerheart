import ForeignDocumentUUIDField from '../fields/foreignDocumentUUIDField.mjs';
import BaseDataItem from './base.mjs';

export default class DHAncestry extends BaseDataItem {
    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Item.ancestry',
            type: 'ancestry',
            hasDescription: true
        });
    }

    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            features: new fields.ArrayField(
                new fields.SchemaField({
                    primary: new fields.BooleanField(),
                    value: new ForeignDocumentUUIDField({ type: 'Item' })
                })
            )
        };
    }
}
