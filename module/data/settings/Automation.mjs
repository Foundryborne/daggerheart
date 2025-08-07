export default class DhAutomation extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            hopeFear: new fields.SchemaField({
                gm: new fields.BooleanField({
                    required: true,
                    initial: false,
                    label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.hopeFear.gm.label'
                }),
                players: new fields.BooleanField({
                    required: true,
                    initial: false,
                    label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.hopeFear.players.label'
                })
            }),
            levelupAuto: new fields.BooleanField({
                required: true,
                initial: true,
                label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.levelupAuto.label'
            }),
            actionPoints: new fields.BooleanField({
                required: true,
                initial: false,
                label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.actionPoints.label'
            }),
            hordeDamage: new fields.BooleanField({
                required: true,
                initial: true,
                label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.hordeDamage.label'
            }),
            effects: new fields.SchemaField({
                rangeDependent: new fields.BooleanField({
                    initial: true,
                    label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.effects.rangeDependent.label'
                })
            }),
            damageReductionRulesDefault: new fields.StringField({
                required: true,
                choices: CONFIG.DH.GENERAL.ruleChoice,
                initial: CONFIG.DH.GENERAL.ruleChoice.onWithToggle.id,
                label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.damageReductionRulesDefault.label'
            }),
            resourceScrollTexts: new fields.BooleanField({
                required: true,
                initial: true,
                label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.resourceScrollTexts.label'
            }),
            playerCanEditSheet: new fields.BooleanField({
                required: true,
                initial: false,
                label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.playerCanEditSheet.label'
            })
        };
    }
}
