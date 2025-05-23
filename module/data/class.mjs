import { getTier } from '../helpers/utils.mjs';
import DhpFeature from './feature.mjs';

export default class DhpClass extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            domains: new fields.ArrayField(new fields.StringField({})),
            classItems: new fields.ArrayField(
                new fields.SchemaField({
                    name: new fields.StringField({}),
                    img: new fields.StringField({}),
                    uuid: new fields.StringField({})
                })
            ),
            damageThresholds: new fields.SchemaField({
                minor: new fields.NumberField({ initial: 0, integer: true }),
                major: new fields.NumberField({ initial: 0, integer: true }),
                severe: new fields.NumberField({ initial: 0, integer: true })
            }),
            evasion: new fields.NumberField({ initial: 0, integer: true }),
            features: new fields.ArrayField(
                new fields.SchemaField({
                    name: new fields.StringField({}),
                    img: new fields.StringField({}),
                    uuid: new fields.StringField({})
                })
            ),
            subclasses: new fields.ArrayField(
                new fields.SchemaField({
                    name: new fields.StringField({}),
                    img: new fields.StringField({}),
                    uuid: new fields.StringField({})
                })
            ),
            inventory: new fields.SchemaField({
                take: new fields.ArrayField(
                    new fields.SchemaField({
                        name: new fields.StringField({}),
                        img: new fields.StringField({}),
                        uuid: new fields.StringField({})
                    })
                ),
                choiceA: new fields.ArrayField(
                    new fields.SchemaField({
                        name: new fields.StringField({}),
                        img: new fields.StringField({}),
                        uuid: new fields.StringField({})
                    })
                ),
                choiceB: new fields.ArrayField(
                    new fields.SchemaField({
                        name: new fields.StringField({}),
                        img: new fields.StringField({}),
                        uuid: new fields.StringField({})
                    })
                ),
                extra: new fields.SchemaField(
                    {
                        title: new fields.StringField({}),
                        description: new fields.StringField({})
                    },
                    { initial: null, nullable: true }
                )
            }),
            characterGuide: new fields.SchemaField({
                suggestedTraits: new fields.SchemaField({
                    agility: new fields.NumberField({ initial: 0, integer: true }),
                    strength: new fields.NumberField({ initial: 0, integer: true }),
                    finesse: new fields.NumberField({ initial: 0, integer: true }),
                    instinct: new fields.NumberField({ initial: 0, integer: true }),
                    presence: new fields.NumberField({ initial: 0, integer: true }),
                    knowledge: new fields.NumberField({ initial: 0, integer: true })
                }),
                suggestedPrimaryWeapon: new fields.SchemaField(
                    {
                        name: new fields.StringField({}),
                        img: new fields.StringField({}),
                        uuid: new fields.StringField({})
                    },
                    { initial: null, nullable: true }
                ),
                suggestedSecondaryWeapon: new fields.SchemaField(
                    {
                        name: new fields.StringField({}),
                        img: new fields.StringField({}),
                        uuid: new fields.StringField({})
                    },
                    { initial: null, nullable: true }
                ),
                suggestedArmor: new fields.SchemaField(
                    {
                        name: new fields.StringField({}),
                        img: new fields.StringField({}),
                        uuid: new fields.StringField({})
                    },
                    { initial: null, nullable: true }
                ),
                characterDescription: new fields.SchemaField({
                    clothes: new fields.StringField({}),
                    eyes: new fields.StringField({}),
                    body: new fields.StringField({}),
                    color: new fields.StringField({}),
                    attitude: new fields.StringField({})
                }),
                backgroundQuestions: new fields.ArrayField(new fields.StringField({}), { initial: ['', '', ''] }),
                connections: new fields.ArrayField(new fields.StringField({}), { initial: ['', '', ''] })
            }),
            multiclass: new fields.NumberField({ initial: null, nullable: true, integer: true }),
            description: new fields.HTMLField({})
        };
    }

    get multiclassTier() {
        return getTier(this.multiclass, true);
    }
}
