export default class DhpMiscellaneous extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.HTMLField({}),
            quantity: new fields.NumberField({ initial: 1, integer: true })
        };
    }
}
