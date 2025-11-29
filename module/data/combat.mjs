export default class DhCombat extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            battleToggles: new fields.ArrayField(
                new fields.SchemaField({
                    category: new fields.NumberField({ required: true, integer: true }),
                    grouping: new fields.StringField({ required: true })
                })
            )
        };
    }
}
