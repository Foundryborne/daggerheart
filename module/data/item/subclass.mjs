import { fromUuids, getFeaturesHTMLData } from '../../helpers/utils.mjs';
import ItemLinkFields from '../fields/itemLinkFields.mjs';
import BaseDataItem from './base.mjs';

export default class DHSubclass extends BaseDataItem {
    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Item.subclass',
            type: 'subclass',
            hasDescription: true
        });
    }

    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            spellcastingTrait: new fields.StringField({
                choices: CONFIG.DH.ACTOR.abilities,
                integer: false,
                nullable: true,
                initial: null,
                label: 'DAGGERHEART.ITEMS.Subclass.spellcastingTrait'
            }),
            features: new ItemLinkFields(),
            featureState: new fields.NumberField({ required: true, initial: 1, min: 1 }),
            isMulticlass: new fields.BooleanField({ initial: false }),
            linkedClass: new fields.DocumentUUIDField({ type: 'Item', nullable: true, initial: null })
        };
    }

    /* -------------------------------------------- */

    /**@override */
    static DEFAULT_ICON = 'systems/daggerheart/assets/icons/documents/items/laurels.svg';

    /* -------------------------------------------- */

    get foundationFeatures() {
        return this.features.filter(x => x.type === CONFIG.DH.ITEM.featureSubTypes.foundation).map(x => x.item);
    }

    get specializationFeatures() {
        return this.features.filter(x => x.type === CONFIG.DH.ITEM.featureSubTypes.specialization).map(x => x.item);
    }

    get masteryFeatures() {
        return this.features.filter(x => x.type === CONFIG.DH.ITEM.featureSubTypes.mastery).map(x => x.item);
    }

    async _preCreate(data, options, user) {
        const allowed = await super._preCreate(data, options, user);
        if (allowed === false) return;

        if (this.actor?.type === 'character') {
            const { value: actorClass, subclass: existingSubclass } = this.actor.system.class;
            const { value: multiclass, subclass: existingMultisubclass } = this.actor.system.multiclass;
            if (!actorClass && !multiclass) {
                ui.notifications.warn('DAGGERHEART.UI.Notifications.missingClass', { localize: true });
                return false;
            }
            if (existingSubclass && existingMultisubclass) {
                ui.notifications.warn('DAGGERHEART.UI.Notifications.subclassesAlreadyPresent', { localize: true });
                return false;
            }
            if (existingSubclass && !multiclass) {
                ui.notifications.warn('DAGGERHEART.UI.Notifications.missingMulticlass', { localize: true });
                return false;
            }

            const match = [multiclass, actorClass].find(c => c && c.sourceUuid === this.linkedClass);
            if (!match) {
                const key = multiclass ? 'subclassNotInMulticlass' : 'subclassNotInClass';
                ui.notifications.warn(`DAGGERHEART.UI.Notifications.${key}`, { localize: true });
                return false;
            } else if (match.system.isMulticlass) {
                await this.updateSource({ isMulticlass: true });
            }
        }
    }

    /**@inheritdoc */
    async getDescriptionData() {
        const baseDescription = this.description;

        const spellcastTrait = this.spellcastingTrait
            ? game.i18n.localize(CONFIG.DH.ACTOR.abilities[this.spellcastingTrait].label)
            : null;

        // Preload all subclass features for acquisition from the cache
        // todo: make feature acquisition async and replace feature helpers for methods
        await fromUuids(this._source.features.map(f => f.item));

        const foundationFeatures = await getFeaturesHTMLData(this.foundationFeatures);
        const specializationFeatures = await getFeaturesHTMLData(this.specializationFeatures);
        const masteryFeatures = await getFeaturesHTMLData(this.masteryFeatures);

        const suffix = await foundry.applications.handlebars.renderTemplate(
            'systems/daggerheart/templates/sheets/items/subclass/description.hbs',
            {
                spellcastTrait,
                foundationFeatures,
                specializationFeatures,
                masteryFeatures
            }
        );

        return { prefix: null, value: baseDescription, suffix };
    }
}
