export default class DhpDamageRoll extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            title: new fields.StringField(),
            roll: new fields.StringField({ required: true }),
            damage: new fields.SchemaField({
                total: new fields.NumberField({ required: true, integer: true }),
                type: new fields.StringField({ choices: Object.keys(SYSTEM.GENERAL.damageTypes), integer: false })
            }),
            dice: new fields.ArrayField(new fields.EmbeddedDataField(DhpDamageDice)),
            modifiers: new fields.ArrayField(
                new fields.SchemaField({
                    value: new fields.NumberField({ required: true, integer: true }),
                    operator: new fields.StringField({ required: true, choices: ['+', '-', '*', '/'] })
                })
            ),
            targets: new fields.ArrayField(
                new fields.SchemaField({
                    id: new fields.StringField({ required: true }),
                    name: new fields.StringField(),
                    img: new fields.StringField()
                })
            )
        };
    }
}

class DhpDamageDice extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            type: new fields.StringField({ required: true }),
            rolls: new fields.ArrayField(new fields.NumberField({ required: true, integer: true }))
        };
    }

    get rollTotal() {
        return this.rolls.reduce((acc, roll) => acc + roll, 0);
    }
}
