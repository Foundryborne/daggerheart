import DhpItem from '../../documents/item.mjs';
import ActionField from '../fields/actionField.mjs';
import DHWeapon from '../item/weapon.mjs';
import BaseDataActor from './base.mjs';

const resourceField = () =>
    new foundry.data.fields.SchemaField({
        value: new foundry.data.fields.NumberField({ initial: 0, integer: true }),
        max: new foundry.data.fields.NumberField({ initial: 0, integer: true })
    });

export default class DhpAdversary extends BaseDataActor {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.Sheets.Adversary'];

    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Actor.adversary',
            type: 'adversary'
        });
    }

    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            tier: new fields.StringField({
                required: true,
                choices: SYSTEM.GENERAL.tiers,
                initial: SYSTEM.GENERAL.tiers.tier1.id
            }),
            type: new fields.StringField({
                required: true,
                choices: SYSTEM.ACTOR.adversaryTypes,
                initial: SYSTEM.ACTOR.adversaryTypes.standard.id
            }),
            motivesAndTactics: new fields.HTMLField(),
            difficulty: new fields.NumberField({ required: true, initial: 1, integer: true }),
            damageThresholds: new fields.SchemaField({
                major: new fields.NumberField({ required: true, initial: 0, integer: true }),
                severe: new fields.NumberField({ required: true, initial: 0, integer: true })
            }),
            resources: new fields.SchemaField({
                hitPoints: resourceField(),
                stress: resourceField()
            }),
            /* attack: new fields.SchemaField({
                name: new fields.StringField({}),
                modifier: new fields.NumberField({ required: true, integer: true, initial: 0 }),
                range: new fields.StringField({
                    required: true,
                    choices: SYSTEM.GENERAL.range,
                    initial: SYSTEM.GENERAL.range.melee.id
                }),
                damage: new fields.SchemaField({
                    value: new fields.StringField(),
                    type: new fields.StringField({
                        required: true,
                        choices: SYSTEM.GENERAL.damageTypes,
                        initial: SYSTEM.GENERAL.damageTypes.physical.id
                    })
                })
            }), */
            /* attack: new fields.EmbeddedDocumentField(DhpItem,
                {
                    // type: 'weapon'
                //    initial: new DhpItem(
                //         {
                //             name: 'Attack',
                //             type: 'weapon'
                //         },
                //         {
                //             parent: this.parent,
                //             parentCollection: 'items'
                //         }
                //     )
                    // initial: {type: 'weapon'}
                }
            ), */
            attack: new ActionField({
                initial: {
                    name: 'Attack',
                    _id: foundry.utils.randomID(),
                    systemPath: 'attack',
                    type: 'attack',
                    range: 'melee',
                    target: {
                        type: 'any',
                        amount: 1
                    },
                    roll: {
                        type: 'weapon'
                    },
                    damage: {
                        parts: [
                            {
                                multiplier: 'flat'
                            }
                        ]
                    }
                }
            }),
            experiences: new fields.TypedObjectField(
                new fields.SchemaField({
                    name: new fields.StringField(),
                    value: new fields.NumberField({ required: true, integer: true, initial: 1 })
                })
            )
            /* Features waiting on pseudo-document data model addition */
        };
    }

    prepareBaseData() {
        // console.log(this.attack)
        /* if(!this.attack) {
            this.attack = new DhpItem(
                {
                    name: 'Attack',
                    type: 'weapon',
                    _id: foundry.utils.randomID()
                },
                {
                    parent: this.parent,
                    parentCollection: 'items'
                }
            )
        } */
    }
}
