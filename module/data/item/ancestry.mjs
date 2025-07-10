import ForeignDocumentUUIDArrayField from '../fields/foreignDocumentUUIDArrayField.mjs';
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
        return {
            ...super.defineSchema(),
            features: new ForeignDocumentUUIDArrayField({ type: 'Item' }),
            primaryFeature: new ForeignDocumentUUIDField({ type: 'Item' }),
            secondaryFeature: new ForeignDocumentUUIDField({ type: 'Item' })
        };
    }
}
