export default class DhpCombat extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            actions: new fields.NumberField({ initial: 0, integer: true }),
            activeCombatant: new fields.StringField({})
        };
    }
}
