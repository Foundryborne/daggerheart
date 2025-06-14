import BaseDataItem from './base.mjs';
import ActionField from '../fields/actionField.mjs';

export default class DHArmor extends BaseDataItem {
    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: "TYPES.Item.armor",
            type: "armor",
            hasDescription: true,
            isQuantifiable: true,
        });
    }

    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            equipped: new fields.BooleanField({ initial: false }),
            baseScore: new fields.NumberField({ integer: true, initial: 0 }),
            feature: new fields.StringField({ choices: SYSTEM.ITEM.armorFeatures, blank: true }),
            marks: new fields.SchemaField({
                max: new fields.NumberField({ initial: 6, integer: true }),
                value: new fields.NumberField({ initial: 0, integer: true })
            }),
            baseThresholds: new fields.SchemaField({
                major: new fields.NumberField({ integer: true, initial: 0 }),
                severe: new fields.NumberField({ integer: true, initial: 0 })
            }),
            actions: new fields.ArrayField(new ActionField())
        };
    }

    get featureInfo() {
        return this.feature ? CONFIG.daggerheart.ITEM.armorFeatures[this.feature] : null;
    }
}
