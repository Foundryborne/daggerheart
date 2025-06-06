export default class DhCombat extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            actions: new fields.NumberField({ initial: 0, integer: true }),
            started: new fields.BooleanField({ required: true, initial: false })
        };
    }
}
