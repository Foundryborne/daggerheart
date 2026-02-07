export default class CompendiumBrowserSettings extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            excludedCompendiumPacks: new fields.TypedObjectField(
                new fields.TypedObjectField(new fields.BooleanField({ required: true, initial: true }))
            )
            // excludedSources: new fields.ArrayField(new fields.StringField({ required: true, nullable: false })),
            // excludedPacks: new fields.TypedObjectField(new fields.SchemaField({
            //     attributionKeys: new fields.ArrayField(new fields.StringField({ required: true, nullable: false })),
            //     excluded: new fields.BooleanField({ required: true, initial: false }),
            // })),
        };
    }
}
