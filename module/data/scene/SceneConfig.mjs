

export default class DhSceneConfig extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            ...super.defineSchema(),
            rangeMeasurementSettingsOverrideField: new fields.BooleanField({
                initial: false,
                label: "Override Global Range Measurement Settings"
            })
        }
    }
}