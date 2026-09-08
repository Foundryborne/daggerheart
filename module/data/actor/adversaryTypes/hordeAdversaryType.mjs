import FormulaField from '../../fields/formulaField.mjs';

export default class HordeAdversaryType extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            type: new fields.StringField({ required: true, nullable: false, blank: false, initial: 'horde' }),
            hordeHP: new fields.NumberField({
                required: true,
                initial: 1,
                integer: true,
                label: 'DAGGERHEART.GENERAL.hordeHp'
            }),
            hordeDamage: new FormulaField({ initial: '1d4', label: 'DAGGERHEART.ACTORS.Adversary.hordeDamage' })
        }
    }
}