const fields = foundry.data.fields;

export default class BeastformField extends fields.SchemaField {
    constructor(options = {}, context = {}) {
        const beastformFields = {
            tierAccess: new fields.SchemaField({
                exact: new fields.NumberField({
                    integer: true,
                    nullable: true,
                    initial: null,
                    choices: () => {
                        const settingsTiers = game.settings.get(
                            CONFIG.DH.id,
                            CONFIG.DH.SETTINGS.gameSettings.LevelTiers
                        ).tiers;
                        return Object.values(settingsTiers).reduce(
                            (acc, tier) => {
                                acc[tier.tier] = game.i18n.localize(tier.name);
                                return acc;
                            },
                            { 1: game.i18n.localize('DAGGERHEART.GENERAL.Tiers.1') }
                        );
                    },
                    hint: 'DAGGERHEART.ACTIONS.Config.beastform.exactHint'
                })
            })
        };
        super(beastformFields, options, context);
    }
}
