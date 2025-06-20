export default class DhVariantRules extends foundry.abstract.DataModel {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.Settings.VariantRules'];

    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            actionTokens: new fields.SchemaField({
                enabled: new fields.BooleanField({
                    required: true,
                    initial: false,
                    label: 'DAGGERHEART.Settings.VariantRules.FIELDS.actionTokens.enabled.label'
                }),
                tokens: new fields.NumberField({
                    required: true,
                    integer: true,
                    initial: 3,
                    label: 'DAGGERHEART.Settings.VariantRules.FIELDS.actionTokens.tokens.label'
                })
            }),
            useCoins: new fields.BooleanField({
                initial: false,
                label: 'DAGGERHEART.Settings.VariantRules.FIELDS.useCoins.label'
            })
        };
    }
}
