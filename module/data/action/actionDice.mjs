import FormulaField from '../fields/formulaField.mjs';

const fields = foundry.data.fields;

export class DHActionDiceData extends foundry.abstract.DataModel {
    /** @override */
    static defineSchema() {
        return {
            multiplier: new fields.StringField({
                choices: SYSTEM.GENERAL.multiplierTypes,
                initial: 'proficiency',
                label: 'Multiplier'
            }),
            flatMultiplier: new fields.NumberField({ nullable: true, initial: 1, label: 'Flat Multiplier' }),
            dice: new fields.StringField({ choices: SYSTEM.GENERAL.diceTypes, initial: 'd6', label: 'Formula' }),
            bonus: new fields.NumberField({ nullable: true, initial: null, label: 'Bonus' }),
            custom: new fields.SchemaField({
                enabled: new fields.BooleanField({ label: 'Custom Formula' }),
                formula: new FormulaField({ label: 'Formula' })
            })
        };
    }

    getFormula(actor) {
        const multiplier = this.multiplier === 'flat' ? this.flatMultiplier : actor.system[this.multiplier]?.total;
        return this.custom.enabled
            ? this.custom.formula
            : `${multiplier ?? 1}${this.dice}${this.bonus ? (this.bonus < 0 ? ` - ${Math.abs(this.bonus)}` : ` + ${this.bonus}`) : ''}`;
    }
}

export class DHDamageField extends fields.SchemaField {
    constructor(options, context = {}) {
        const damageFields = {
            parts: new fields.ArrayField(new fields.EmbeddedDataField(DHDamageData)),
            includeBase: new fields.BooleanField({ initial: false })
        };
        // if (hasBase) damageFields.includeBase = new fields.BooleanField({ initial: true });
        super(damageFields, options, context);
    }
}

export class DHDamageData extends foundry.abstract.DataModel {
    /** @override */
    static defineSchema() {
        return {
            // ...super.defineSchema(),
            base: new fields.BooleanField({ initial: false, readonly: true, label: 'Base' }),
            type: new fields.StringField({
                choices: SYSTEM.GENERAL.damageTypes,
                initial: 'physical',
                label: 'Type',
                nullable: false,
                required: true
            }),
            resultBased: new fields.BooleanField({ initial: false, label: "DAGGERHEART.Actions.Settings.ResultBased.label" }),
            value: new fields.EmbeddedDataField(DHActionDiceData),
            valueAlt: new fields.EmbeddedDataField(DHActionDiceData),
        };
    }
}
