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
                game.system.api.documents.DhActiveEffect.applyChange(
                    actor,
                    {
                        ...change,
                        key: 'system.attack.name',
                        type: 'override',
                        value: change.value.name
                    },
                    replacementData
                );
            }
            
            if (change.value.img) {
                game.system.api.documents.DhActiveEffect.applyChange(
                    actor,
                    {
                        ...change,
                        key: 'system.attack.img',
                        type: 'override',
                        value: change.value.img
                    },
                    replacementData
                );
            }

            if (change.value.trait) {
                game.system.api.documents.DhActiveEffect.applyChange(
                    actor,
                    {
                        ...change,
                        key: 'system.attack.roll.trait',
                        type: 'override',
                        value: change.value.trait
                    },
                    replacementData
                );
            }

            if (change.value.damageTypes) {
                game.system.api.documents.DhActiveEffect.applyChange(
                    actor,
                    {
                        ...change,
                        key: 'system.attack.damage.main.type',
                        type: 'override',
                        value: Array.from(change.value.damageTypes)
                    },
                    replacementData
                );
            }

            if (change.value.attackRange) {
                game.system.api.documents.DhActiveEffect.applyChange(
                    actor,
                    {
                        ...change,
                        key: 'system.attack.range',
                        type: 'override',
                        value: change.value.attackRange
                    },
                    replacementData
                );
            }

            if (change.value.damageFormula) {
                game.system.api.documents.DhActiveEffect.applyChange(
                    actor,
                    {
                        ...change,
                        key: 'system.attack.damage.main.value.custom.enabled',
                        type: 'override',
                        value: true
                    },
                    replacementData
                );

                game.system.api.documents.DhActiveEffect.applyChange(
                    actor,
                    {
                        ...change,
                        key: 'system.attack.damage.main.value.custom.formula',
                        type: 'override',
                        value: change.value.damageFormula
                    },
                    replacementData
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
