import BaseDataItem from './base.mjs';
import { fromUuids, getFeaturesHTMLData } from '../../helpers/utils.mjs';
import ForeignDocumentUUIDArrayField from '../fields/foreignDocumentUUIDArrayField.mjs';

export default class DHTransformation extends BaseDataItem {
    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Item.transformation',
            type: 'transformation',
            hasDescription: true
        });
    }

    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            features: new ForeignDocumentUUIDArrayField({ type: 'Item' }),
            questions: new fields.HTMLField()
        };
    }

    /* -------------------------------------------- */

    /**@override */
    static DEFAULT_ICON = 'systems/daggerheart/assets/icons/documents/items/vampire-dracula.svg';

    /* -------------------------------------------- */

    /** @inheritdoc */
    async getDescriptionData(options) {
        // Preload all transformation features for acquisition from the cache
        // todo: make feature acquisition async and replace feature helpers for methods
        await fromUuids(this._source.features.map(f => f.item));
        const features = await getFeaturesHTMLData(this.features);

        if (!features.length) return { prefix: null, value: this.description, suffix: null };
        const suffix = await foundry.applications.handlebars.renderTemplate(
            'systems/daggerheart/templates/sheets/items/description.hbs',
            { label: 'DAGGERHEART.ITEMS.Transformation.featuresLabel', features }
        );

        return { prefix: null, value: this.description, suffix };
    }
}