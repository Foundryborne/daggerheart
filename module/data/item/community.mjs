import { fromUuids, getFeaturesHTMLData } from '../../helpers/utils.mjs';
import ForeignDocumentUUIDArrayField from '../fields/foreignDocumentUUIDArrayField.mjs';
import BaseDataItem from './base.mjs';

const fields = foundry.data.fields;

export default class DHCommunity extends BaseDataItem {
    static embedTemplate = 'systems/daggerheart/templates/components/card/community.hbs';

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
            features: new ForeignDocumentUUIDArrayField({ type: 'Item' }),
            /** An id or path to the journal page that has information for this community */
            loreReference: new fields.StringField({ required: true, blank: false, nullable: true })
        };
    }

    /* -------------------------------------------- */

    /**@override */
    static DEFAULT_ICON = 'systems/daggerheart/assets/icons/documents/items/village.svg';

    /** @inheritdoc */
    async getDescriptionData(options = {}) {
        // Preload all community features for acquisition from the cache
        // todo: make feature acquisition async and replace feature helpers for methods
        await fromUuids(this._source.features);

        const showReferenceInline = options.type === 'sheet';
        const reference = (CONFIG.DH.lore.community[this.loreReference] ?? this.loreReference ?? '').replace(/\[\]/g, '');
        const label = _loc('DAGGERHEART.ITEMS.Base.viewReference');
        const referenceLink = showReferenceInline && reference?.includes('JournalEntry.') 
            ? `<p>@UUID[${reference}]{${label}}</p>` : '';

        const baseDescription = `${this.description}${referenceLink}`;
        const features = await getFeaturesHTMLData(this.features);

        if (!features.length) return { prefix: null, value: baseDescription, suffix: null };
        const suffix = await foundry.applications.handlebars.renderTemplate(
            'systems/daggerheart/templates/sheets/items/description.hbs',
            { features }
        );

        return { prefix: null, value: baseDescription, suffix };
    }

    /** @inheritdoc */
    async toEmbed(config = {}, options = {}) {
        // Card styling has certain defaults designed for embedding
        config.caption ??= false;
        config.cite ??= false;
        config.inline ??= true;

        const description = await this.getEnrichedDescription({ ...options, gmNotes: false, type: 'tooltip' });
        const content = await foundry.applications.handlebars.renderTemplate(this.constructor.embedTemplate, {
            item: this.parent,
            description
        })
        const container = document.createElement('div');
        container.innerHTML = content;
        return container.children;
    }
}
