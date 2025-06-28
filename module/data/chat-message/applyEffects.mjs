export default class DHApplyEffect extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            title: new fields.StringField(),
            origin: new fields.StringField({}),
            description: new fields.StringField({}),
            targets: new fields.ArrayField(
                new fields.SchemaField({
                    id: new fields.StringField({ required: true }),
                    name: new fields.StringField(),
                    img: new fields.StringField(),
                    hit: new fields.BooleanField({ initial: false })
                })
            ),
            action: new fields.SchemaField({
                itemId: new fields.StringField(),
                actionId: new fields.StringField()
            })
        };
    }
}
