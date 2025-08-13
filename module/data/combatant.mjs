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

    get isDefeated() {
        const { unconscious, defeated, dead } = CONFIG.DH.GENERAL.conditions;
        const defeatedConditions = new Set([unconscious.id, defeated.id, dead.id]);
        return this.defeated || this.actor?.statuses.intersection(defeatedConditions)?.size;
    }
}
