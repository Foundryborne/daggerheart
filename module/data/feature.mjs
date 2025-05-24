import { getTier } from '../helpers/utils.mjs';
import DaggerheartAction from './action.mjs';
import DhpEffect from './interface/effects.mjs';

export default class DhpFeature extends DhpEffect {
    static defineSchema() {
        const fields = foundry.data.fields;
        return foundry.utils.mergeObject(
            {},
            {
                type: new fields.StringField({ choices: SYSTEM.ITEM.featureTypes }),
                actionType: new fields.StringField({
                    choices: SYSTEM.ITEM.actionTypes,
                    initial: SYSTEM.ITEM.actionTypes.passive.id
                }),
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
                        refreshed: new fields.BooleanField({ initial: true })
                    },
                    { nullable: true, initial: null }
                ),
                multiclass: new fields.NumberField({ initial: null, nullable: true, integer: true }),
                disabled: new fields.BooleanField({ initial: false }),
                description: new fields.HTMLField({}),
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
                            { choices: SYSTEM.EFFECTS.applyLocations },
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
                actions: new fields.ArrayField(new fields.EmbeddedDataField(DaggerheartAction))
            }
        );
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
}
