import BaseDataItem from './base.mjs';
import ActionField from '../fields/actionField.mjs';
import { armorFeatures } from '../../config/itemConfig.mjs';

export default class DHArmor extends BaseDataItem {
    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Item.armor',
            type: 'armor',
            hasDescription: true,
            isQuantifiable: true
        });
    }

    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            equipped: new fields.BooleanField({ initial: false }),
            baseScore: new fields.NumberField({ integer: true, initial: 0 }),
            features: new fields.ArrayField(
                new fields.SchemaField({
                    value: new fields.StringField({ required: true, choices: SYSTEM.ITEM.armorFeatures, blank: true }),
                    effectIds: new fields.ArrayField(new fields.StringField({ required: true }))
                })
            ),
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

    async _preUpdate(changes, options, user) {
        const allowed = await super._preUpdate(changes, options, user);
        if (allowed === false) return false;

        if (changes.system.features) {
            const removed = this.features.filter(x => !changes.system.features.includes(x));
            const added = changes.system.features.filter(x => !this.features.includes(x));

            for (var feature of removed) {
                for (var effectId of feature.effectIds) {
                    await this.parent.effects.get(effectId).delete();
                }
            }

            for (var feature of added) {
                const featureData = armorFeatures[feature.value];
                if (featureData.effects?.length > 0) {
                    const embeddedItems = await this.parent.createEmbeddedDocuments('ActiveEffect', [
                        {
                            name: game.i18n.localize(featureData.label),
                            description: game.i18n.localize(featureData.description),
                            changes: featureData.effects.flatMap(x => x.changes)
                        }
                    ]);
                    feature.effectIds = embeddedItems.map(x => x.id);
                }
            }
        }
    }
}
