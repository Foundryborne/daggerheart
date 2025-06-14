import BaseDataItem from './base.mjs';
import FormulaField from '../fields/formulaField.mjs';
import ActionField from '../fields/actionField.mjs';
import { weaponFeatures } from '../../config/itemConfig.mjs';
import { actionsTypes } from '../../data/_module.mjs';

export default class DHWeapon extends BaseDataItem {
    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Item.weapon',
            type: 'weapon',
            hasDescription: true,
            isQuantifiable: true,
            embedded: {
                feature: 'featureTest'
            }
        });
    }

    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            tier: new fields.NumberField({ required: true, integer: true, initial: 1, min: 1 }),
            equipped: new fields.BooleanField({ initial: false }),

            //SETTINGS
            secondary: new fields.BooleanField({ initial: false }),
            trait: new fields.StringField({ required: true, choices: SYSTEM.ACTOR.abilities, initial: 'agility' }),
            range: new fields.StringField({ required: true, choices: SYSTEM.GENERAL.range, initial: 'melee' }),
            burden: new fields.StringField({ required: true, choices: SYSTEM.GENERAL.burden, initial: 'oneHanded' }),
            //DAMAGE
            damage: new fields.SchemaField({
                value: new FormulaField({ initial: 'd6' }),
                type: new fields.StringField({
                    required: true,
                    choices: SYSTEM.GENERAL.damageTypes,
                    initial: 'physical'
                })
            }),
            features: new fields.ArrayField(
                new fields.SchemaField({
                    value: new fields.StringField({ required: true, choices: SYSTEM.ITEM.weaponFeatures, blank: true }),
                    effectIds: new fields.ArrayField(new fields.StringField({ required: true })),
                    actionIds: new fields.ArrayField(new fields.StringField({ required: true }))
                })
            ),
            actions: new fields.ArrayField(new ActionField())
        };
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

                changes.system.actions = this.actions.filter(x => !feature.actionIds.includes(x._id));
            }

            for (var feature of added) {
                const featureData = weaponFeatures[feature.value];
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
                if (featureData.actions?.length > 0) {
                    const newActions = featureData.actions.map(action => {
                        const cls = actionsTypes[action.type];
                        return new cls(
                            { ...action, _id: foundry.utils.randomID(), name: game.i18n.localize(action.name) },
                            { parent: this }
                        );
                    });
                    changes.system.actions = [...this.actions, ...newActions];
                    feature.actionIds = newActions.map(x => x._id);
                }
            }
        }
    }
}
