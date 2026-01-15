//Extra definitions for RollTable
export default class DhRollTableData extends foundry.abstract.TypeDataModel {
    static defineSchema(){
        const fields = foundry.data.fields;

        return{
            formulaName: new fields.StringField({ // This is to give a name to go together with the core.formula
              required:true,
              nullable: false,
              initial: 'Formula' // Should be a translation
            }),
            altFormula: new fields.ArrayField(
                new fields.SchemaField({
                    key: new fields.StringField({
                        required:false,
                        nullable:false,
                        blank:true
                    }),
                    formula: new fields.StringField({
                        required:true,
                        blank:false,
                        initial:"1d4" //Filler value
                    })
                })
            )
        }
    }
}