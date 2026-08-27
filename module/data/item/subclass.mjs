import { fromUuids, getFeaturesHTMLData } from '../../helpers/utils.mjs';
import ItemLinkFields from '../fields/itemLinkFields.mjs';
import BaseDataItem from './base.mjs';

export default class DHSubclass extends BaseDataItem {
    static embedTemplate = 'systems/daggerheart/templates/components/card/subclass.hbs';

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

    prepareDerivedData() {
        super.prepareDerivedData();
        this.classItem = this.actor?.items.find(i => i.type === 'class' && i.sourceUuid === this.linkedClass);
    }

    /**@inheritdoc */
    async getDescriptionData(config = {}) {
        const baseDescription = this.description;
        const spellcastTrait = this.spellcastingTrait
            ? game.i18n.localize(CONFIG.DH.ACTOR.abilities[this.spellcastingTrait].label)
            : null;
        
        if (config.type === 'embed') {
            // for now, tooltips do not show any specific version. Eventually we may want rank specific embeds via dataset params or something
            return { value: baseDescription };
        } else {
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

    /** @inheritdoc */
    async toEmbed(config = {}, options = {}) {
        // Card styling has certain defaults designed for embedding
        config.caption ??= false;
        config.cite ??= false;
        config.inline ??= true;

        const classItem = await fromUuid(this.linkedClass);
        const domains = CONFIG.DH.DOMAIN.allDomains();
        const classDomains = classItem?.system.domains?.slice(0, 2) ?? []; // 2 max for displays

        const description = await this.getEnrichedDescription({ ...options, gmNotes: false, type: 'embed' });
        const content = await foundry.applications.handlebars.renderTemplate(this.constructor.embedTemplate, {
            item: this.parent,
            description,
            classItem,
            domain1: foundry.utils.mergeObject({ color: 'black' }, domains[classDomains[0]] ?? {}),
            domain2: foundry.utils.mergeObject({ color: 'black' }, domains[classDomains[1]] ?? domains[classDomains[0]] ?? {})
        })
        const container = document.createElement('div');
        container.innerHTML = content;
        if (['dark', 'light'].includes(config.theme)) {
            container.children[0].classList.add('themed', `theme-${config.theme}`);
        }
        return container.children;
    }
}
