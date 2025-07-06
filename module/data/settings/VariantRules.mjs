export default class DhVariantRules extends foundry.abstract.DataModel {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.SETTINGS.VariantRules'];

    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            actionTokens: new fields.SchemaField({
                enabled: new fields.BooleanField({
                    required: true,
                    initial: false,
                    label: 'DAGGERHEART.SETTINGS.VariantRules.FIELDS.actionTokens.enabled.label'
                }),
                tokens: new fields.NumberField({
                    required: true,
                    integer: true,
                    initial: 3,
                    label: 'DAGGERHEART.SETTINGS.VariantRules.FIELDS.actionTokens.tokens.label'
                })
            }),
            useCoins: new fields.BooleanField({
                initial: false,
                label: 'DAGGERHEART.SETTINGS.VariantRules.FIELDS.useCoins.label'
            })
        };
    }
}
