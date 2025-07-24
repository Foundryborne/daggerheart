const fields = foundry.data.fields;

export default class CostField extends fields.ArrayField {
    constructor(options={}, context={}) {
        const element = new fields.SchemaField({
            key: new fields.StringField({
                nullable: false,
                required: true,
                initial: 'hope'
            }),
            keyIsID: new fields.BooleanField(),
            value: new fields.NumberField({ nullable: true, initial: 1 }),
            scalable: new fields.BooleanField({ initial: false }),
            step: new fields.NumberField({ nullable: true, initial: null })
        });
        super(element, options, context);
    }
}