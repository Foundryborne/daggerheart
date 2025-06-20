export default class DHDamageRoll extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            title: new fields.StringField(),
            roll: new fields.StringField({ required: true }),
            damage: new fields.SchemaField({
                total: new fields.NumberField({ required: true, integer: true }),
                type: new fields.StringField({ choices: Object.keys(SYSTEM.GENERAL.damageTypes), integer: false })
            }),
            dice: new fields.ArrayField(
                new fields.SchemaField({
                    type: new fields.StringField({ required: true }),
                    rolls: new fields.ArrayField(new fields.NumberField({ required: true, integer: true })),
                    total: new fields.NumberField({ integer: true })
                })
            ),
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
