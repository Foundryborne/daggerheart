const fields = foundry.data.fields;

export default class UsesField extends fields.SchemaField {
    constructor(options={}, context={}) {
        const usesFields = {
            value: new fields.NumberField({ nullable: true, initial: null }),
            max: new fields.NumberField({ nullable: true, initial: null }),
            recovery: new fields.StringField({
                choices: CONFIG.DH.GENERAL.refreshTypes,
                initial: null,
                nullable: true
            })
        };
        super(usesFields, options, context);
    }
}