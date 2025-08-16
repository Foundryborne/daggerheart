const fields = foundry.data.fields;

export default class EffectsField extends fields.ArrayField {
    static order = 100;

    constructor(options = {}, context = {}) {
        const element = new fields.SchemaField({
            _id: new fields.DocumentIdField(),
            onSave: new fields.BooleanField({ initial: false })
        });
        super(element, options, context);
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
