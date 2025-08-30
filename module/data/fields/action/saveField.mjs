const fields = foundry.data.fields;

export default class SaveField extends fields.SchemaField {
    constructor(options = {}, context = {}) {
        const saveFields = {
            trait: new fields.StringField({
                nullable: true,
                initial: null,
                choices: CONFIG.DH.ACTOR.abilities
            }),
            difficulty: new fields.NumberField({ nullable: true, initial: null, integer: true, min: 0 }),
            damageMod: new fields.StringField({
                initial: CONFIG.DH.ACTIONS.damageOnSave.none.id,
                choices: CONFIG.DH.ACTIONS.damageOnSave,
                nullable: false,
                required: true
            })
        };
        super(saveFields, options, context);
    }
}
