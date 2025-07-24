const fields = foundry.data.fields;

export default class BeastformField extends fields.SchemaField {
    constructor(options = {}, context = {}) {
        const beastformFields = {
            tierAccess: new fields.SchemaField({
                exact: new fields.NumberField({ integer: true, nullable: true, initial: null })
            })
        };
        super(beastformFields, options, context);
    }
}
