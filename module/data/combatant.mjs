export default class DhCombatant extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            active: new fields.BooleanField({ initial: false }),
            actionTokens: new fields.NumberField({ required: true, integer: true, initial: 3 })
        };
    }
}
