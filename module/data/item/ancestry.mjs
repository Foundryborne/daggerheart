import ForeignDocumentUUIDArrayField from '../fields/foreignDocumentUUIDArrayField.mjs';
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
            features: new ForeignDocumentUUIDArrayField({ type: 'Item' })
        };
    }

    get primaryFeature() {
        return this.features.find(x => x?.system?.primary) ?? (this.features.length > 0 ? {} : null);
    }

    get secondaryFeature() {
        return this.features.find(x => !x?.system?.primary);
    }
}
