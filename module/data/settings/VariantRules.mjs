export default class DhVariantRules extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            actionTokens: new fields.SchemaField({
                enabled: new fields.BooleanField({ required: true, initial: false }),
                tokens: new fields.NumberField({ required: true, integer: true, initial: 3 })
            })
        };
    }

    static defaultSchema = {};
}
