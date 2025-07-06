export default class DhAutomation extends foundry.abstract.DataModel {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.SETTINGS.Automation']; // Doesn't work for some reason

    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            hope: new fields.BooleanField({ required: true, initial: false, label: "DAGGERHEART.Settings.Automation.FIELDS.hope.label" }), // Label need to be updated into something like "Duality Roll Auto Gain" + a hint
            actionPoints: new fields.BooleanField({ required: true, initial: false, label: "DAGGERHEART.Settings.Automation.FIELDS.actionPoints.label" }),
            countdowns: new fields.BooleanField({ requireD: true, initial: false, label: "DAGGERHEART.Settings.Automation.FIELDS.countdowns.label" })
        };
    }
}
