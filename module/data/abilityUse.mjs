export default class DhpAbilityUse extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            title: new fields.StringField({}),
            img: new fields.StringField({}),
            name: new fields.StringField({}),
            description: new fields.StringField({}),
            actions: new fields.ArrayField(
                new fields.SchemaField({
                    name: new fields.StringField({}),
                    damage: new fields.SchemaField({
                        type: new fields.StringField({}),
                        value: new fields.StringField({})
                    }),
                    healing: new fields.SchemaField({
                        type: new fields.StringField({}),
                        value: new fields.StringField({})
                    }),
                    cost: new fields.SchemaField({
                        type: new fields.StringField({ nullable: true }),
                        value: new fields.NumberField({ nullable: true })
                    }),
                    target: new fields.SchemaField({
                        type: new fields.StringField({})
                    })
                })
            )
        };
    }
}
