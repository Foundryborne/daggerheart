import FormulaField from './fields/formulaField.mjs';

//Extra definitions for RollTable
export default class DhRollTable extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            formulaName: new fields.StringField({
                required: true,
                nullable: false,
                initial: () => game.i18n.localize('DAGGERHEART.ROLLTABLES.DEFAULT_FORMULA_NAME'),
                label: 'DAGGERHEART.ROLLTABLES.FIELDS.formulaName.label'
            }),
            altFormula: new fields.TypedObjectField(
                new fields.SchemaField({
                    name: new fields.StringField({
                        required: true,
                        nullable: false,
                        initial: () => game.i18n.localize('DAGGERHEART.ROLLTABLES.DEFAULT_FORMULA_NAME'),
                        label: 'DAGGERHEART.ROLLTABLES.FIELDS.formulaName.label'
                    }),
                    formula: new FormulaField({ label: 'DAGGERHEART.ROLLTABLES.FIELDS.formula.label', initial: '1d20' })
                })
            ),
            activeAltFormula: new fields.StringField({ nullable: true, initial: null })
        };
    }

    getActiveFormula(baseFormula) {
        return this.activeAltFormula ? (this.altFormula[this.activeAltFormula]?.formula ?? baseFormula) : baseFormula;
    }

    static getDefaultFormula = () => ({
        name: game.i18n.localize('Roll Formula'),
        formula: '1d20'
    });
}
