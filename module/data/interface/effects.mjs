import DaggerheartAction from '../action.mjs';
import { MappingField } from '../fields.mjs';

export default class DhpEffects extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            effects: new MappingField(
                new fields.SchemaField({
                    type: new fields.StringField({ choices: Object.keys(SYSTEM.EFFECTS.effectTypes) }),
                    valueType: new fields.StringField({ choices: Object.keys(SYSTEM.EFFECTS.valueTypes) }),
                    parseType: new fields.StringField({ choices: Object.keys(SYSTEM.EFFECTS.parseTypes) }),
                    initiallySelected: new fields.BooleanField({ initial: true }),
                    options: new fields.ArrayField(
                        new fields.SchemaField({
                            name: new fields.StringField({}),
                            value: new fields.StringField({})
                        }),
                        { nullable: true, initial: null }
                    ),
                    dataField: new fields.StringField({}),
                    appliesOn: new fields.StringField(
                        { choices: Object.keys(SYSTEM.EFFECTS.applyLocations) },
                        { nullable: true, initial: null }
                    ),
                    applyLocationChoices: new MappingField(new fields.StringField({}), {
                        nullable: true,
                        initial: null
                    }),
                    valueData: new fields.SchemaField({
                        value: new fields.StringField({}),
                        fromValue: new fields.StringField({ initial: null, nullable: true }),
                        type: new fields.StringField({ initial: null, nullable: true }),
                        hopeIncrease: new fields.StringField({ initial: null, nullable: true })
                    })
                })
            ),
            actions: new fields.ArrayField(new fields.EmbeddedDataField(DaggerheartAction))
            // actions: new fields.SchemaField({
            //   damage: new fields.ArrayField(new fields.SchemaField({
            //     type: new fields.StringField({ choices: Object.keys(SYSTEM.GENERAL.extendedDamageTypes), initial: SYSTEM.GENERAL.extendedDamageTypes.physical.id }),
            //     value: new fields.StringField({}),
            //   })),
            //   uses: new fields.SchemaField({
            //     nr: new fields.StringField({}),
            //     refreshType: new fields.StringField({ choices: Object.keys(SYSTEM.GENERAL.refreshTypes), initial: SYSTEM.GENERAL.refreshTypes.session.id }),
            //     refreshed: new fields.BooleanField({ initial: true }),
            //   }),
            // }),
        };
    }

    get effectData() {
        const effectValues = Object.values(this.effects);
        const effectCategories = Object.keys(SYSTEM.EFFECTS.effectTypes).reduce((acc, effectType) => {
            acc[effectType] = effectValues.reduce((acc, effect) => {
                if (effect.type === effectType) {
                    acc.push({ ...effect, valueData: this.#parseValues(effect.parseType, effect.valueData) });
                }

                return acc;
            }, []);

            return acc;
        }, {});

        return effectCategories;
    }

    #parseValues(parseType, values) {
        return Object.keys(values).reduce((acc, prop) => {
            acc[prop] = this.#parseValue(parseType, values[prop]);

            return acc;
        }, {});
    }

    #parseValue(parseType, value) {
        switch (parseType) {
            case SYSTEM.EFFECTS.parseTypes.number.id:
                return Number.parseInt(value);
            default:
                return value;
        }
    }
}
