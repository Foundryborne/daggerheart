import BaseDataItem from './base.mjs';
import ItemLinkFields from '../../data/fields/itemLinkFields.mjs';

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
            features: new ItemLinkFields()
        };
    }


    /* -------------------------------------------- */

    /**@override */
    static DEFAULT_ICON = 'systems/daggerheart/assets/icons/documents/items/family-tree.svg';

    /* -------------------------------------------- */

    /**
     * Gets the primary feature.
     * @type {foundry.documents.Item|null} Returns the item of the first feature with type "primary" or null if none is found.
     */
    get primaryFeature() {
        return this.features.find(x => x.type === CONFIG.DH.ITEM.featureSubTypes.primary)?.item;
    }

    /**
     * Gets the secondary feature.
     * @type {foundry.documents.Item|null} Returns the item of the first feature with type "secondary" or null if none is found.
     */
    get secondaryFeature() {
        return this.features.find(x => x.type === CONFIG.DH.ITEM.featureSubTypes.secondary)?.item;
    }
}
