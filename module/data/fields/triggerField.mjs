export default class TriggerField extends foundry.data.fields.SchemaField {
    constructor(context) {
        super(
            {
                trigger: new foundry.data.fields.StringField({
                    nullable: false,
                    blank: false,
                    initial: CONFIG.DH.TRIGGER.triggers.dualityRoll.id,
                    choices: CONFIG.DH.TRIGGER.triggers,
                    label: 'DAGGERHEART.CONFIG.Triggers.triggerType'
                }),
                triggeringActorType: new foundry.data.fields.StringField({
                    nullable: false,
                    blank: false,
                    initial: CONFIG.DH.TRIGGER.triggerActorTargetType.any.id,
                    choices: CONFIG.DH.TRIGGER.triggerActorTargetType,
                    label: 'DAGGERHEART.CONFIG.Triggers.triggeringActorType'
                }),
                command: new foundry.data.fields.JavaScriptField({ async: true })
            },
            context
        );
    }
}
