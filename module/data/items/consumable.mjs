export default class DHConsumable extends foundry.abstract.TypeDataModel {
    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.HTMLField({}),
            quantity: new fields.NumberField({ initial: 1, integer: true }),
            consumeOnUse: new fields.BooleanField({ initial: false })
        };
    }
}
