export default class DhVariantRules extends foundry.abstract.DataModel {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.Settings.VariantRules'];

    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            actionTokens: new fields.SchemaField({
                enabled: new fields.BooleanField({ required: true, initial: false }),
                tokens: new fields.NumberField({ required: true, integer: true, initial: 3 })
            }),
            useCoins: new fields.BooleanField({ initial: false })
        };
    }

    static defaultSchema = {};
}
