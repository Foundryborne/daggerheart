import FormulaField from "../fields/formulaField.mjs";

const fields = foundry.data.fields;

export default class DHDamageData extends foundry.abstract.DataModel {
    /** @override */
    static defineSchema() {
        return {
            multiplier: new fields.StringField({ choices: SYSTEM.GENERAL.multiplierTypes, initial: 'proficiency', label: 'Multiplier' }),
            dice: new fields.StringField({ choices: SYSTEM.GENERAL.diceTypes, initial: 'd6', label: 'Formula' }),
            bonus: new fields.NumberField({ nullable: true, initial: null, label: 'Bonus' }),
            base: new fields.BooleanField({ initial: false, readonly: true, label: 'Base' }),
            type: new fields.StringField({
                choices: SYSTEM.GENERAL.damageTypes,
                initial: 'physical',
                label: 'Type',
                nullable: false,
                required: true
            }),
            custom: new fields.SchemaField({
                enabled: new fields.BooleanField({ label: 'Custom Formula' }),
                formula: new FormulaField( { label: 'Formula' } )
            })
        }
    }
}