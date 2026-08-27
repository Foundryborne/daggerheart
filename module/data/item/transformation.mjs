import BaseDataItem from './base.mjs';
import { fromUuids, getFeaturesHTMLData } from '../../helpers/utils.mjs';
import ForeignDocumentUUIDArrayField from '../fields/foreignDocumentUUIDArrayField.mjs';

export default class DHTransformation extends BaseDataItem {
    static embedTemplate = 'systems/daggerheart/templates/components/card/transformation.hbs';

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
            questions: new fields.HTMLField(),
            /** An id or path to the journal page that has the full description for this ancestry */
            loreReference: new fields.StringField({ required: true, blank: false, nullable: true })
        };
    }

    /* -------------------------------------------- */

    /**@override */
    static DEFAULT_ICON = 'systems/daggerheart/assets/icons/documents/items/vampire-dracula.svg';

    /* -------------------------------------------- */

    /** @inheritdoc */
    async getDescriptionData() {
        const features = await getFeaturesHTMLData(await fromUuids(this._source.features));
        if (!features.length) return { prefix: null, value: this.description, suffix: null };
        const suffix = await foundry.applications.handlebars.renderTemplate(
            'systems/daggerheart/templates/sheets/items/description.hbs',
            { features }
        );

        return { prefix: null, value: this.description, suffix };
    }

    /** @inheritdoc */
    async toEmbed(config = {}, options = {}) {
        // Card styling has certain defaults designed for embedding
        config.caption ??= false;
        config.cite ??= false;
        config.inline ??= true;

        const description = await this.getEnrichedDescription({ ...options, gmNotes: false, type: 'embed' });
        const content = await foundry.applications.handlebars.renderTemplate(this.constructor.embedTemplate, {
            item: this.parent,
            description,
            type: _loc('TYPES.Item.transformation')
        })
        const container = document.createElement('div');
        container.innerHTML = content;
        if (['dark', 'light'].includes(config.theme)) {
            container.children[0].classList.add('themed', `theme-${config.theme}`);
        }
        return container.children;
    }
}