export default class DhAutomation extends foundry.abstract.DataModel {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.SETTINGS.Automation']; // Doesn't work for some reason

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
            actionPoints: new fields.BooleanField({
                required: true,
                initial: false,
                label: 'DAGGERHEART.SETTINGS.Automation.FIELDS.actionPoints.label'
            })
        };
    }
}
