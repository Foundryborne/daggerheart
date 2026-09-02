import BaseDataItem from './base.mjs';
import ItemLinkFields from '../../data/fields/itemLinkFields.mjs';
import { fromUuids, getFeaturesHTMLData } from '../../helpers/utils.mjs';

const fields = foundry.data.fields;

export default class DHAncestry extends BaseDataItem {
    static embedTemplate = 'systems/daggerheart/templates/components/card/ancestry.hbs';

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
            features: new ItemLinkFields(),
            /** An id or path to the journal page that has the full description for this ancestry */
            loreReference: new fields.StringField({ required: true, blank: false, nullable: true })
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

    /** @inheritdoc */
    async getDescriptionData(options) {
        const showReferenceInline = options.type === 'sheet';
        const reference = (CONFIG.DH.lore.ancestry[this.loreReference] ?? this.loreReference ?? '').replace(/\[\]/g, '');
        const label = _loc('DAGGERHEART.ITEMS.Base.viewReference');
        const referenceLink = showReferenceInline && reference?.includes('JournalEntry.')
            ? `<p>@UUID[${reference}]{${label}}</p>` : '';

        const baseDescription = `${this.description}${referenceLink}`;
        const features = await getFeaturesHTMLData(await fromUuids(this._source.features.map(f => f.item)));

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

        const description = await this.getEnrichedDescription({ gmNotes: false, type: 'embed' }, options);
        const content = await foundry.applications.handlebars.renderTemplate(this.constructor.embedTemplate, {
            item: this.parent,
            description
        })
        const container = document.createElement('div');
        container.innerHTML = content;
        if (['dark', 'light'].includes(config.theme)) {
            container.children[0].classList.add('themed', `theme-${config.theme}`);
        }
        return container.children;
    }
}
