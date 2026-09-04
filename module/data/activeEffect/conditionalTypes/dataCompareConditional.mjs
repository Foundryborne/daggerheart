import FormulaField from '../../fields/formulaField.mjs';

export default class DataCompareConditional extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            type: new fields.StringField({ 
                label: 'DAGGERHEART.GENERAL.type',
                required: true, 
                nullable: false, 
                blank: false, 
                initial: 'dataCompare' 
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
        if (!this.key || this.value === undefined) return true;

        const comparator = CONFIG.DH.EFFECTS.conditionalComparators[this.comparator];
        const data = foundry.utils.getProperty(rollData, this.key);
        const value = Roll.replaceFormulaData(this.value, rollData);
        if (!data || (!comparator.ignoresValue && !value)) return true;

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