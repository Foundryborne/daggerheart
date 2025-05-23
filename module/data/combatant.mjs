export default class DhpCombatant extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            active: new fields.BooleanField({ initial: false })
        };
    }
}
