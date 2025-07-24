const fields = foundry.data.fields;

export default class TargetField extends fields.SchemaField {
    constructor(options={}, context={}) {
        const targetFields = {
            type: new fields.StringField({
                choices: CONFIG.DH.ACTIONS.targetTypes,
                initial: CONFIG.DH.ACTIONS.targetTypes.any.id,
                nullable: true,
                initial: null
            }),
            amount: new fields.NumberField({ nullable: true, initial: null, integer: true, min: 0 })
        };
        super(targetFields, options, context);
    }
}