import FormulaField from '../fields/formulaField.mjs';

const fields = foundry.data.fields;

/* Roll Field */

export class DHActionRollData extends foundry.abstract.DataModel {
    /** @override */
    static defineSchema() {
        return {
            type: new fields.StringField({ nullable: true, initial: null, choices: CONFIG.DH.GENERAL.rollTypes }),
            trait: new fields.StringField({ nullable: true, initial: null, choices: CONFIG.DH.ACTOR.abilities }),
            difficulty: new fields.NumberField({ nullable: true, initial: null, integer: true, min: 0 }),
            bonus: new fields.NumberField({ nullable: true, initial: null, integer: true }),
            advState: new fields.StringField({ choices: CONFIG.DH.ACTIONS.advandtageState, initial: 'neutral' }),
            diceRolling: new fields.SchemaField({
                multiplier: new fields.StringField({
                    choices: CONFIG.DH.GENERAL.diceSetNumbers,
                    initial: 'prof',
                    label: 'Dice Number'
                }),
                flatMultiplier: new fields.NumberField({ nullable: true, initial: 1, label: 'Flat Multiplier' }),
                dice: new fields.StringField({
                    choices: CONFIG.DH.GENERAL.diceTypes,
                    initial: 'd6',
                    label: 'Dice Type'
                }),
                compare: new fields.StringField({
                    choices: CONFIG.DH.ACTIONS.diceCompare,
                    initial: 'above',
                    label: 'Should be'
                }),
                treshold: new fields.NumberField({ initial: 1, integer: true, min: 1, label: 'Treshold' })
            }),
            useDefault: new fields.BooleanField({ initial: false })
        };
    }

    getFormula() {
        if (!this.type) return;
        let formula = '';
        switch (this.type) {
            case 'diceSet':
                const multiplier =
                    this.diceRolling.multiplier === 'flat'
                        ? this.diceRolling.flatMultiplier
                        : `@${this.diceRolling.multiplier}`;
                formula = `${multiplier}${this.diceRolling.dice}cs${CONFIG.DH.ACTIONS.diceCompare[this.diceRolling.compare].operator}${this.diceRolling.treshold}`;
                break;
            default:
                formula = '';
                break;
        }
        return formula;
    }
}

/* Damage & Healing Field */

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
                formula: new FormulaField({ label: 'Formula' })
            })
        };
    }

    getFormula() {
        const multiplier = this.multiplier === 'flat' ? this.flatMultiplier : `@${this.multiplier}`,
            bonus = this.bonus ? (this.bonus < 0 ? ` - ${Math.abs(this.bonus)}` : ` + ${this.bonus}`) : '';
        return this.custom.enabled ? this.custom.formula : `${multiplier ?? 1}${this.dice}${bonus}`;
    }
}

export class DHDamageField extends fields.SchemaField {
    constructor(options, context = {}) {
        const damageFields = {
            parts: new fields.ArrayField(new fields.EmbeddedDataField(DHDamageData)),
            includeBase: new fields.BooleanField({ initial: false })
        };
        super(damageFields, options, context);
    }
}

export class DHDamageData extends foundry.abstract.DataModel {
    /** @override */
    static defineSchema() {
        return {
            base: new fields.BooleanField({ initial: false, readonly: true, label: 'Base' }),
            type: new fields.SetField(
                new fields.StringField({
                    choices: CONFIG.DH.GENERAL.damageTypes,
                    initial: 'physical',
                    nullable: false,
                    required: true
                }),
                {
                    label: 'Type',
                    initial: 'physical',
                }
            ),
            resultBased: new fields.BooleanField({
                initial: false,
                label: 'DAGGERHEART.ACTIONS.Settings.resultBased.label'
            }),
            value: new fields.EmbeddedDataField(DHActionDiceData),
            valueAlt: new fields.EmbeddedDataField(DHActionDiceData)
        };
    }
}
