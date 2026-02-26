import BaseDataItem from './base.mjs';
import ItemLinkFields from '../../data/fields/itemLinkFields.mjs';
import { getFeaturesHTMLData } from '../../helpers/utils.mjs';

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

    /**@inheritdoc */
    async getDescriptionData() {
        const baseDescription = this.description;
        const features = await getFeaturesHTMLData(this.features);

        if (!features.length) return { prefix: null, value: baseDescription, suffix: null };
        const suffix = await foundry.applications.handlebars.renderTemplate(
            'systems/daggerheart/templates/sheets/items/description.hbs',
            { label: 'DAGGERHEART.ITEMS.Ancestry.featuresLabel', features }
        );

        return { prefix: null, value: baseDescription, suffix };
    }
}
