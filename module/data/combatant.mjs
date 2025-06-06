export default class DhCombatant extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            spotlight: new fields.SchemaField({
                requesting: new fields.BooleanField({ required: true, initial: false })
            }),
            actionTokens: new fields.NumberField({ required: true, integer: true, initial: 3 })
        };
    }
}
