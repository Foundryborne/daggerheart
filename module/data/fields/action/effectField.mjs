const fields = foundry.data.fields;

export default class EffectField extends fields.ArrayField {
    constructor(options={}, context={}) {
        const element = new fields.SchemaField({
            _id: new fields.DocumentIdField(),
            onSave: new fields.BooleanField({ initial: false })
        });
        super(element, options, context);
    }
}