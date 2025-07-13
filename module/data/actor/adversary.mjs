import DHAdversarySettings from '../../applications/sheets-configs/adversary-settings.mjs';
import ActionField from '../fields/actionField.mjs';
import BaseDataActor from './base.mjs';

const resourceField = () =>
    new foundry.data.fields.SchemaField({
        value: new foundry.data.fields.NumberField({ initial: 0, integer: true }),
        max: new foundry.data.fields.NumberField({ initial: 0, integer: true }),
        isReversed: new foundry.data.fields.BooleanField({ initial: true })
    });

export default class DhpAdversary extends BaseDataActor {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.ACTORS.Adversary'];

    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Actor.adversary',
            type: 'adversary',
            settingSheet: DHAdversarySettings
        });
    }

    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            tier: new fields.StringField({
                required: true,
                choices: CONFIG.DH.GENERAL.tiers,
                initial: CONFIG.DH.GENERAL.tiers.tier1.id
            }),
            type: new fields.StringField({
                required: true,
                choices: CONFIG.DH.ACTOR.adversaryTypes,
                initial: CONFIG.DH.ACTOR.adversaryTypes.standard.id
            }),
            motivesAndTactics: new fields.StringField(),
            notes: new fields.HTMLField(),
            difficulty: new fields.NumberField({ required: true, initial: 1, integer: true }),
            hordeHp: new fields.NumberField({ required: true, initial: 1, integer: true }),
            damageThresholds: new fields.SchemaField({
                major: new fields.NumberField({ required: true, initial: 0, integer: true }),
                severe: new fields.NumberField({ required: true, initial: 0, integer: true })
            }),
            resources: new fields.SchemaField({
                hitPoints: resourceField(),
                stress: resourceField()
            }),
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
                        type: 'weapon'
                    },
                    damage: {
                        parts: [
                            {
                                type: ['physical'],
                                value: {
                                    multiplier: 'flat'
                                }
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
            ),
            bonuses: new fields.SchemaField({
                difficulty: new fields.SchemaField({
                    all: new fields.NumberField({ integer: true, initial: 0 }),
                    reaction: new fields.NumberField({ integer: true, initial: 0 })
                })
            })
        };
    }

    get attackBonus() {
        return this.attack.roll.bonus;
    }

    get features() {
        return this.parent.items.filter(x => x.type === 'feature');
    }
}
