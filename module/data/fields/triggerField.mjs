export default class TriggerField extends foundry.data.fields.SchemaField {
    constructor(context) {
        super(
            {
                trigger: new foundry.data.fields.StringField({
                    nullable: false,
                    initial: CONFIG.DH.TRIGGER.triggers.dualityRoll.id,
                    choices: CONFIG.DH.TRIGGER.triggers
                }),
                command: new foundry.data.fields.JavaScriptField({ async: true })
            },
            context
        );
    }
}
