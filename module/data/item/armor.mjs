import BaseDataItem from './base.mjs';
import { updateItemFeatures } from './helpers.mjs';

export default class DHArmor extends BaseDataItem {
    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Item.armor',
            type: 'armor',
            hasDescription: true,
            isInventoryItem: true,
            hasActions: true,
            hasResource: true
        });
    }

    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            tier: new fields.NumberField({ required: true, integer: true, initial: 1, min: 1 }),
            equipped: new fields.BooleanField({ initial: false }),
            armor: new fields.SchemaField({
                current: new fields.NumberField({ integer: true, min: 0, initial: 0 }),
                max: new fields.NumberField({ required: true, integer: true, initial: 0 })
            }),
            baseThresholds: new fields.SchemaField({
                major: new fields.NumberField({ integer: true, initial: 0 }),
                severe: new fields.NumberField({ integer: true, initial: 0 })
            }),
            armorFeatures: new fields.ArrayField(
                new fields.SchemaField({
                    value: new fields.StringField({
                        required: true
                    }),
                    effectIds: new fields.ArrayField(new fields.StringField({ required: true })),
                    actionIds: new fields.ArrayField(new fields.StringField({ required: true }))
                })
            )
        };
    }

    /* -------------------------------------------- */

    /**@override */
    static DEFAULT_ICON = 'systems/daggerheart/assets/icons/documents/items/chest-armor.svg';

    /* -------------------------------------------- */

    get customActions() {
        return this.actions.filter(
            action => !this.armorFeatures.some(feature => feature.actionIds.includes(action.id))
        );
    }

    get itemFeatures() {
        return this.armorFeatures;
    }

    /**@inheritdoc */
    async getDescriptionData() {
        const baseDescription = this.description;
        const allFeatures = CONFIG.DH.ITEM.allArmorFeatures();
        const features = this.armorFeatures.map(x => allFeatures[x.value]).filter(x => x);

        const prefix = await foundry.applications.handlebars.renderTemplate(
            'systems/daggerheart/templates/sheets/items/description.hbs',
            { features }
        );

        return { prefix, value: baseDescription, suffix: null };
    }

    /**@inheritdoc */
    async _preUpdate(changes, options, user) {
        const allowed = await super._preUpdate(changes, options, user);
        if (allowed === false) return false;

        if (changes.system?.armorFeatures) {
            await updateItemFeatures(
                this.parent,
                changes,
                'armorFeatures',
                CONFIG.DH.ITEM.allArmorFeatures
            );
        }

    }

    /** @inheritDoc */
    static migrateDocumentData(source) {
        if (!source.system.armor) {
            source.system.armor = { current: source.system.marks?.value ?? 0, max: source.system.baseScore ?? 0 };
        }
    }

    /**
     * Generates a list of localized tags based on this item's type-specific properties.
     * @returns {string[]} An array of localized tag strings.
     */
    _getTags() {
        const tags = [
            `${game.i18n.localize('DAGGERHEART.ITEMS.Armor.baseScore')}: ${this.armor.max}`,
            `${game.i18n.localize('DAGGERHEART.ITEMS.Armor.baseThresholds.base')}: ${this.baseThresholds.major} / ${this.baseThresholds.severe}`
        ];

        return tags;
    }

    /**
     * Generate a localized label array for this item subtype.
     * @returns {(string | { value: string, icons: string[] })[]} An array of localized strings and damage label objects.
     */
    _getLabels() {
        const labels = [`${game.i18n.localize('DAGGERHEART.ITEMS.Armor.baseScore')}: ${this.armor.max}`];
        return labels;
    }
}
