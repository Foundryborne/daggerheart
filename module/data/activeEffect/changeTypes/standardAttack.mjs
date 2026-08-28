import FormulaField from '../../fields/formulaField.mjs';

const fields = foundry.data.fields;
export default class StandardAttackChange extends foundry.abstract.DataModel {
    #single = true;

    static defineSchema() {
        return {
            type: new fields.StringField({ required: true, choices: ['standardAttack'], initial: 'standardAttack' }),
            priority: new fields.NumberField({ 
                label: 'EFFECT.FIELDS.changes.element.priority.label',
                required: true, 
                integer: true, 
                initial: 0
            }),
            phase: new fields.StringField({ required: true, blank: false, initial: 'initial' }),
            value: new fields.SchemaField({
                damageFormula: new FormulaField({
                    label: 'DAGGERHEART.EFFECTS.ChangeTypes.standardAttack.FIELDS.damageFormula'
                }),
                damageTypes: new fields.SetField(new fields.StringField({
                    choices: CONFIG.DH.GENERAL.damageTypes
                }), { label: 'DAGGERHEART.EFFECTS.ChangeTypes.standardAttack.FIELDS.damageTypes' }),
                attackRange: new fields.StringField({
                    label: 'DAGGERHEART.EFFECTS.ChangeTypes.standardAttack.FIELDS.attackRange',
                    nullable: true,
                    choices: CONFIG.DH.GENERAL.range,
                    initial: null
                }),
                name: new fields.StringField({
                    label: 'DAGGERHEART.EFFECTS.ChangeTypes.standardAttack.FIELDS.name',
                    nullable: true,
                    initial: null
                }),
                img: new fields.FilePathField({
                    label: 'DAGGERHEART.EFFECTS.ChangeTypes.standardAttack.FIELDS.img',
                    categories: ['IMAGE'],
                    base64: false,
                    nullable: true,
                    initial: null
                }),
                trait: new fields.StringField({
                    label: 'DAGGERHEART.EFFECTS.ChangeTypes.standardAttack.FIELDS.trait',
                    nullable: true,
                    choices: CONFIG.DH.ACTOR.abilities,
                    initial: null
                })
            })
        };
    }

    get single() {
        return this.#single;
    }

    static changeEffect = {
        label: 'Standard Attack',
        defaultPriority: 20,
        handler: (actor, change, _options, _field, replacementData) => {
            if (change.value.name) {
                foundry.utils.setProperty(
                    actor,
                    'system.attack.name',
                    change.value.name
                );
            }
            
            if (change.value.img) {
                foundry.utils.setProperty(
                    actor,
                    'system.attack.img',
                    change.value.img
                );
            }

            if (change.value.trait) {
                foundry.utils.setProperty(
                    actor,
                    'system.attack.roll.trait',
                    change.value.trait
                );
            }

            if (change.value.damageTypes) {
                foundry.utils.setProperty(
                    actor,
                    'system.attack.damage.main.type',
                    Array.from(change.value.damageTypes)
                );
            }

            if (change.value.attackRange) {
                foundry.utils.setProperty(
                    actor,
                    'system.attack.range',
                    change.value.attackRange
                );
            }

            if (change.value.damageFormula) {
                foundry.utils.setProperty(
                    actor,
                    'system.attack.damage.main.value.custom.enabled',
                    true
                );

                foundry.utils.setProperty(
                    actor,
                    'system.attack.damage.main.value.custom.formula',
                    change.value.damageFormula
                );
            }

            return {};
        },
        render: null
    };

    static getInitialValue() {
        return {
            type: CONFIG.DH.EFFECTS.customChangeTypes.standardAttack.id,
            priority: 0,
            phase: 'initial',
            value: {
                name: null,
                img: null,
                trait: null,
                formula: ''
            }
        };
    }
}
