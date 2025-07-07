import BaseDataItem from './base.mjs';
import { actionsTypes } from '../action/_module.mjs';
import ActionField from '../fields/actionField.mjs';

export default class DHWeapon extends BaseDataItem {
    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Item.weapon',
            type: 'weapon',
            hasDescription: true,
            isQuantifiable: true,
            isInventoryItem: true,
            // hasInitialAction: true
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
            burden: new fields.StringField({ required: true, choices: CONFIG.DH.GENERAL.burden, initial: 'oneHanded' }),
            
            features: new fields.ArrayField(
                new fields.SchemaField({
                    value: new fields.StringField({
                        required: true,
                        choices: CONFIG.DH.ITEM.weaponFeatures,
                        blank: true
                    }),
                    effectIds: new fields.ArrayField(new fields.StringField({ required: true })),
                    actionIds: new fields.ArrayField(new fields.StringField({ required: true }))
                })
            ),
            attack: new ActionField({
                initial: {
                    name: 'Attack',
                    img: 'icons/skills/melee/blood-slash-foam-red.webp',
                    _id: foundry.utils.randomID(),
                    systemPath: 'attack',
                    type: 'attack',
                    range: 'melee',
                    target: {
                        type: 'any',
                        amount: 1
                    },
                    roll: {
                        trait: 'agility',
                        type: 'weapon'
                    },
                    damage: {
                        parts: [
                            {
                                value: {
                                    multiplier: 'prof',
                                    dice: "d8"
                                }
                            }
                        ]
                    }
                }
            }),
            actions: new fields.ArrayField(new ActionField())
        };
    }

    get actionsList() {
        return [this.attack, ...this.actions];
    }

    async _preUpdate(changes, options, user) {
        const allowed = await super._preUpdate(changes, options, user);
        if (allowed === false) return false;

        if (changes.system?.features) {
            const removed = this.features.filter(x => !changes.system.features.includes(x));
            const added = changes.system.features.filter(x => !this.features.includes(x));

            for (let weaponFeature of removed) {
                for (var effectId of weaponFeature.effectIds) {
                    await this.parent.effects.get(effectId).delete();
                }

                changes.system.actions = this.actions.filter(x => !weaponFeature.actionIds.includes(x._id));
            }

            for (let weaponFeature of added) {
                const featureData = CONFIG.DH.ITEM.weaponFeatures[weaponFeature.value];
                if (featureData.effects?.length > 0) {
                    const embeddedItems = await this.parent.createEmbeddedDocuments('ActiveEffect', [
                        {
                            name: game.i18n.localize(featureData.label),
                            description: game.i18n.localize(featureData.description),
                            changes: featureData.effects.flatMap(x => x.changes)
                        }
                    ]);
                    weaponFeature.effectIds = embeddedItems.map(x => x.id);
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
                    weaponFeature.actionIds = newActions.map(x => x._id);
                }
            }
        }
    }
}
