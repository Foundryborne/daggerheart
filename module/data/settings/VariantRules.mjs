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
            rangeMeasurement: new fields.SchemaField({
                enabled: new fields.BooleanField({
                    required: true,
                    initial: true,
                    label: 'DAGGERHEART.GENERAL.enabled'
                }),
                melee: new fields.NumberField({
                    required: true,
                    initial: 5,
                    label: 'DAGGERHEART.CONFIG.Range.melee.name'
                }),
                veryClose: new fields.NumberField({
                    required: true,
                    initial: 15,
                    label: 'DAGGERHEART.CONFIG.Range.veryClose.name'
                }),
                close: new fields.NumberField({
                    required: true,
                    initial: 30,
                    label: 'DAGGERHEART.CONFIG.Range.close.name'
                }),
                far: new fields.NumberField({ required: true, initial: 60, label: 'DAGGERHEART.CONFIG.Range.far.name' })
            })
        };
    }
}
