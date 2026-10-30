import FormulaField from '../../fields/formulaField.mjs';

const fields = foundry.data.fields;
export default class DamageReductionChange extends foundry.abstract.DataModel {
    #single = true;

    static defineSchema() {
        return {
            type: new fields.StringField({ required: true, choices: ['damageReduction'], initial: 'damageReduction' }),
            priority: new fields.NumberField({ 
                label: 'EFFECT.FIELDS.changes.element.priority.label',
                required: true,
                integer: true, 
                initial: 0
            }),
            phase: new fields.StringField({ required: true, blank: false, initial: 'initial' }),
            value: new fields.SchemaField({
                label: new fields.StringField({
                    required: true, 
                    nullable: false,
                    label: 'DAGGERHEART.GENERAL.label'
                }),
                value: new FormulaField({
                    label: 'DAGGERHEART.GENERAL.value'
                }),
                costs: new fields.ArrayField(new fields.SchemaField({
                    type: new fields.StringField({
                        label: 'DAGGERHEART.GENERAL.type',
                        choices: CONFIG.DH.GENERAL.healingTypes
                    }),
                    value: new fields.NumberField({
                        label: 'DAGGERHEART.GENERAL.value', 
                        initial: 1, 
                        min: 0 
                    })
                }))
            })
        };
    }

    get single() {
        return this.#single;
    }

    static changeEffect = {
        label: 'Damage Reduction',
        defaultPriority: 50,
        handler: (actor, change, _options) => {
            if (change.value.label && change.value.value) {
                const damageReduction = {
                    label: change.value.label,
                    value: change.value.value,
                    costs: change.value.costs 
                };
                foundry.utils.setProperty(
                    actor,
                    'system.rules.damageReduction.reductions',
                    [...actor.system.rules.damageReduction.reductions, damageReduction]
                );
            }

            return {};
        },
        render: null
    };

    static getInitialValue() {
        return {
            type: CONFIG.DH.EFFECTS.customChangeTypes.damageReduction.id,
            priority: 0,
            phase: 'initial',
            value: {
                label: 'New Reduction',
                value: '1',
                costs: []
            }
        };
    }
}
