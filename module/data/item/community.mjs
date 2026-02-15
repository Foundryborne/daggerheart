import ForeignDocumentUUIDArrayField from '../fields/foreignDocumentUUIDArrayField.mjs';
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
        return {
            ...super.defineSchema(),
            features: new ForeignDocumentUUIDArrayField({ type: 'Item' })
        };
    }

    /* -------------------------------------------- */

    /**@override */
    static DEFAULT_ICON = 'systems/daggerheart/assets/icons/documents/items/village.svg';

    /**@inheritdoc */
    async getDescriptionData() {
        const baseDescription = this.description;
        const features = [];
        for (const feature of this.features) {
            if (feature) {
                const item = feature.system ? feature : await foundry.utils.fromUuid(feature.uuid);
                const itemDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
                    item.system.description
                );
                features.push({ label: item.name, description: itemDescription });
            }
        }

        if (!features.length) return { prefix: null, value: baseDescription, suffix: null };
        const suffix = await foundry.applications.handlebars.renderTemplate(
            'systems/daggerheart/templates/sheets/items/description.hbs',
            { label: 'DAGGERHEART.ITEMS.Community.featuresLabel', features }
        );

        return { prefix: null, value: baseDescription, suffix };
    }
}
