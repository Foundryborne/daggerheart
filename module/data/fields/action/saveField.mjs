const fields = foundry.data.fields;

export default class SaveField extends fields.SchemaField {
    static order = 75;

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
                choices: CONFIG.DH.ACTIONS.damageOnSave
            })
        };
        super(saveFields, options, context);
    }

    static async execute(config) {
        if(!this.hasRoll) {
            const roll = new CONFIG.Dice.daggerheart.DHRoll('');
            roll._evaluated = true;
            await CONFIG.Dice.daggerheart.DHRoll.toMessage(roll, config);
        } else {
            return;
        }
    }
}
