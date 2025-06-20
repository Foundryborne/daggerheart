import { getTier } from '../../helpers/utils.mjs';
import DHAction from '../action/action.mjs';
import BaseDataItem from './base.mjs';
import ActionField from '../fields/actionField.mjs';

export default class DHFeature extends BaseDataItem {
    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Item.feature',
            type: 'feature',
            hasDescription: true
        });
    }

    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),

            //A type of feature seems unnecessary
            type: new fields.StringField({ choices: SYSTEM.ITEM.featureTypes }),

            //TODO: remove  actionType field
            actionType: new fields.StringField({
                choices: SYSTEM.ITEM.actionTypes,
                initial: SYSTEM.ITEM.actionTypes.passive.id
            }),
            //TODO: remove  featureType field
            featureType: new fields.SchemaField({
                type: new fields.StringField({
                    choices: SYSTEM.ITEM.valueTypes,
                    initial: Object.keys(SYSTEM.ITEM.valueTypes).find(x => x === 'normal')
                }),
                data: new fields.SchemaField({
                    value: new fields.StringField({}),
                    property: new fields.StringField({
                        choices: SYSTEM.ACTOR.featureProperties,
                        initial: Object.keys(SYSTEM.ACTOR.featureProperties).find(x => x === 'spellcastingTrait')
                    }),
                    max: new fields.NumberField({ initial: 1, integer: true }),
                    numbers: new fields.TypedObjectField(
                        new fields.SchemaField({
                            value: new fields.NumberField({ integer: true }),
                            used: new fields.BooleanField({ initial: false })
                        })
                    )
                })
            }),
            refreshData: new fields.SchemaField(
                {
                    type: new fields.StringField({ choices: SYSTEM.GENERAL.refreshTypes }),
                    uses: new fields.NumberField({ initial: 1, integer: true }),
                    //TODO: remove refreshed field
                    refreshed: new fields.BooleanField({ initial: true })
                },
                { nullable: true, initial: null }
            ),
            //TODO: remove refreshed field
            multiclass: new fields.NumberField({ initial: null, nullable: true, integer: true }),
            disabled: new fields.BooleanField({ initial: false }),

            //TODO: re do it completely or just remove it
            effects: new fields.TypedObjectField(
                new fields.SchemaField({
                    type: new fields.StringField({ choices: SYSTEM.EFFECTS.effectTypes }),
                    valueType: new fields.StringField({ choices: SYSTEM.EFFECTS.valueTypes }),
                    parseType: new fields.StringField({ choices: SYSTEM.EFFECTS.parseTypes }),
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
                        {
                            choices: SYSTEM.EFFECTS.applyLocations
                        },
                        { nullable: true, initial: null }
                    ),
                    applyLocationChoices: new fields.TypedObjectField(new fields.StringField({}), {
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
            actions: new fields.ArrayField(new ActionField())
        };
    }

    get multiclassTier() {
        return getTier(this.multiclass);
    }

    async refresh() {
        if (this.refreshData) {
            if (this.featureType.type === SYSTEM.ITEM.valueTypes.dice.id) {
                const update = { 'system.refreshData.refreshed': true };
                Object.keys(this.featureType.data.numbers).forEach(
                    x => (update[`system.featureType.data.numbers.-=${x}`] = null)
                );
                await this.parent.update(update);
            } else {
                await this.parent.update({ 'system.refreshData.refreshed': true });
            }
        }
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
