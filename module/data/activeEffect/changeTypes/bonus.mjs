import { omit } from '../../../helpers/functional.mjs';
import { nestedReplaceFormulaData, resolveNearestDocument } from '../../../helpers/utils.mjs';

const DIE_SIZES = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];

const fields = foundry.data.fields;
export default class BonusChange extends foundry.abstract.DataModel {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.EFFECTS.ChangeTypes.bonus'];

    static defineSchema() {
        return {
            type: new fields.StringField({ required: true, choices: ['bonus'], initial: 'bonus' }),
            phase: new fields.StringField({ required: true, blank: false, initial: 'initial' }),
            identifier: new fields.StringField({ 
                nullable: true,
                blank: false,
                initial: null
            }),
            priority: new fields.NumberField({
                label: 'EFFECT.FIELDS.changes.element.priority.label',
                required: true, 
                integer: true,
                initial: 20
            }),
            affects: new fields.StringField({
                required: true,
                nullable: false,
                choices: {
                    roll: 'Roll',
                    damage: 'Damage',
                    healing: 'Healing'
                },
                initial: 'roll'
            }),
            damageType: new fields.StringField({
                choices: CONFIG.DH.GENERAL.damageTypes,
                nullable: true,
                initial: null
            }),
            value: new fields.SchemaField({
                multiplier: new fields.StringField({
                    choices: omit(CONFIG.DH.GENERAL.multiplierTypes, ['cost']),
                    initial: 'flat',
                    label: 'DAGGERHEART.ACTIONS.Config.damage.multiplier',
                    nullable: false,
                    required: true
                }),
                flatMultiplier: new fields.StringField({
                    nullable: false,
                    blank: false,
                    initial: '0',
                    label: 'DAGGERHEART.ACTIONS.Config.damage.flatMultiplier'
                }),
                dice: new fields.StringField({
                    choices: CONFIG.DH.GENERAL.diceTypes,
                    initial: CONFIG.DH.GENERAL.diceTypes.d6,
                    label: 'DAGGERHEART.GENERAL.Dice.single',
                    nullable: false,
                    required: true
                }),
                bonus: new fields.StringField({ nullable: false, blank: false, initial: '0', label: 'DAGGERHEART.GENERAL.bonus' })
            })
        }
    }

    static changeEffect = {
        label: 'Bonus',
        defaultPriority: 20,
        render: null
    };

    static getInitialValue() {
        return this.schema.getInitialValue();
    }

    _initialize(options) {
        super._initialize(options);
        if (typeof this.value === 'string') {
            debugger;
        }
        this.identifier ??= resolveNearestDocument(this, ActiveEffect)?.name?.slugify();
    }

    getFormula({ rollData, adjustments } = []) {
        const multiplier = nestedReplaceFormulaData(this.value.multiplier === 'flat' ? this.value.flatMultiplier : `@${this.value.multiplier}`, rollData);
        let dice = nestedReplaceFormulaData(this.value.dice, rollData);
        const bonus = this.value.bonus ? nestedReplaceFormulaData(this.value.bonus, rollData) : 0;

        for (const adjustment of adjustments) {
            if (adjustment.change.type === 'dice') {
                dice = this.#applyDiceAdjustment(dice, adjustment.change, rollData);
            }
        }

        if (!multiplier || multiplier === '0') return String(bonus || 0);
        const finalDice = `${multiplier ?? 1}${dice}`;
        const sign = Number(bonus) < 0 ? ' - ' : ' + ';
        return bonus && bonus !== '0' ? `${finalDice}${sign}${Math.abs(bonus)}` : finalDice;
    }

    #applyDiceAdjustment(value, adjustment, rollData) {
        const newValue = nestedReplaceFormulaData(adjustment.value, rollData);
        if (adjustment.mode === 'override') {
            return nestedReplaceFormulaData(newValue, rollData);
        } else if (['upgrade', 'downgrade'].includes(adjustment.mode)) {
            const thisIndex = DIE_SIZES.indexOf(value);
            const newIndex = DIE_SIZES.indexOf(newValue);
            if (newIndex === -1) return value;

            const isUpgrade = adjustment.mode === 'upgrade';
            const isGreater = newIndex > thisIndex;
            return isUpgrade === isGreater ? newValue : value;
        } else {
            const steps = Number(newValue);
            if (Number.isNaN(steps)) return value; // failure

            const thisIndex = DIE_SIZES.indexOf(value);
            const sign = adjustment.mode === 'subtract' ? -1 : 1;
            const newIndex = Math.clamp(thisIndex + (sign * steps), 0, DIE_SIZES.length - 1);
            return DIE_SIZES[newIndex]
        }
    }
}
