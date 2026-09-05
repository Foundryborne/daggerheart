import { conditionalFailureModes, conditionalPhases } from '../../../config/effectConfig.mjs';
import FormulaField from '../../fields/formulaField.mjs';
import { conditionalTypes } from './_module.mjs';

export default class DataCompareConditional extends foundry.abstract.DataModel {
    static get metadata() {
        return {
            phase: conditionalPhases.preparation.id,
            failureMode: conditionalFailureModes.suppress.id
        }
    }

    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            type: new fields.StringField({ 
                label: 'DAGGERHEART.GENERAL.type',
                required: true, 
                nullable: false, 
                blank: false, 
                initial: conditionalTypes.dataCompare.id
            }),
            key: new fields.StringField({
                label: 'DAGGERHEART.GENERAL.key'
            }),
            comparator: new fields.StringField({ 
                label: 'DAGGERHEART.EFFECTS.Conditionals.dataCompare.comparator',
                required: true, 
                nullable: false, 
                choices: CONFIG.DH.EFFECTS.conditionalComparators, 
                initial: CONFIG.DH.EFFECTS.conditionalComparators.equals.id
            }),
            value: new FormulaField({
                label: 'DAGGERHEART.GENERAL.value'
            })
        }
    }

    doesConditionalPass(rollData) {
        const comparator = CONFIG.DH.EFFECTS.conditionalComparators[this.comparator];
        if (!this.key || (!comparator.ignoresValue && this.value === undefined)) return true;

        const data = foundry.utils.getProperty(rollData, this.key);
        if (data === undefined) return true;

        const replacedValue = this.value ? Roll.replaceFormulaData(this.value, rollData) : null;
        const value = replacedValue ? (new Roll(replacedValue)).evaluateSync().total : null;
        switch (this.comparator) {
            case CONFIG.DH.EFFECTS.conditionalComparators.less.id:
                return data < value;
            case CONFIG.DH.EFFECTS.conditionalComparators.lessEquals.id:
                return data <= value;
            case CONFIG.DH.EFFECTS.conditionalComparators.equals.id:
                return data == value;
            case CONFIG.DH.EFFECTS.conditionalComparators.greaterEquals.id:
                return data >= value;
            case CONFIG.DH.EFFECTS.conditionalComparators.greater.id:
                return data > value;
            case CONFIG.DH.EFFECTS.conditionalComparators.truthy.id:
                return Boolean(data);
            case CONFIG.DH.EFFECTS.conditionalComparators.falsy.id:
                return !data;
        }
    }
}