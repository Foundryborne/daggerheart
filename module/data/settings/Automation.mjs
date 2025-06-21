export default class DhAutomation extends foundry.abstract.DataModel {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.Settings.Automation']; // Doesn't work for some reason

    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            hope: new fields.BooleanField({ required: true, initial: false }),
            actionPoints: new fields.BooleanField({ required: true, initial: false }),
            countdowns: new fields.BooleanField({ requireD: true, initial: false })
        };
    }
}
