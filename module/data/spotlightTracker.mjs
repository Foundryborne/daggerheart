export default class SpotlightTracker extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            spotlightedTokens: new fields.SetField(new fields.DocumentUUIDField())
        };
    }
}
