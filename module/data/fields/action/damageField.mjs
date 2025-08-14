import FormulaField from '../formulaField.mjs';

const fields = foundry.data.fields;

export default class DamageField extends fields.SchemaField {
    constructor(options, context = {}) {
        const damageFields = {
            parts: new fields.ArrayField(new fields.EmbeddedDataField(DHDamageData)),
            includeBase: new fields.BooleanField({
                initial: false,
                label: 'DAGGERHEART.ACTIONS.Settings.includeBase.label'
            })
        };
        super(damageFields, options, context);
    }
}

export class DHActionDiceData extends foundry.abstract.DataModel {
    /** @override */
    static defineSchema() {
        return {
            multiplier: new fields.StringField({
                choices: CONFIG.DH.GENERAL.multiplierTypes,
                initial: 'prof',
                label: 'Multiplier'
            }),
            flatMultiplier: new fields.NumberField({ nullable: true, initial: 1, label: 'Flat Multiplier' }),
            dice: new fields.StringField({ choices: CONFIG.DH.GENERAL.diceTypes, initial: 'd6', label: 'Dice' }),
            bonus: new fields.NumberField({ nullable: true, initial: null, label: 'Bonus' }),
            custom: new fields.SchemaField({
                enabled: new fields.BooleanField({ label: 'Custom Formula' }),
                formula: new FormulaField({ label: 'Formula', initial: "" })
            })
        };
    }

    getFormula() {
        const multiplier = this.multiplier === 'flat' ? this.flatMultiplier : `@${this.multiplier}`,
            bonus = this.bonus ? (this.bonus < 0 ? ` - ${Math.abs(this.bonus)}` : ` + ${this.bonus}`) : '';
        return this.custom.enabled ? this.custom.formula : `${multiplier ?? 1}${this.dice}${bonus}`;
    }
}

export class DHResourceData extends foundry.abstract.DataModel {
    /** @override */
    static defineSchema() {
        return {
            applyTo: new fields.StringField({
                choices: CONFIG.DH.GENERAL.healingTypes,
                required: true,
                blank: false,
                initial: CONFIG.DH.GENERAL.healingTypes.hitPoints.id,
                label: 'DAGGERHEART.ACTIONS.Settings.applyTo.label'
            }),
            resultBased: new fields.BooleanField({
                initial: false,
                label: 'DAGGERHEART.ACTIONS.Settings.resultBased.label'
            }),
            value: new fields.EmbeddedDataField(DHActionDiceData),
            valueAlt: new fields.EmbeddedDataField(DHActionDiceData)
        };
    }
}

export class DHDamageData extends DHResourceData {
    /** @override */
    static defineSchema() {
        return {
            ...super.defineSchema(),
            base: new fields.BooleanField({ initial: false, readonly: true, label: 'Base' }),
            type: new fields.SetField(
                new fields.StringField({
                    choices: CONFIG.DH.GENERAL.damageTypes,
                    initial: 'physical',
                    nullable: false,
                    required: true
                }),
                {
                    label: 'Type'
                }
            )
        };
    }
}
