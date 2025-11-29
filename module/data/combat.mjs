export default class DhCombat extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            battleToggles: new fields.ArrayField(
                new fields.SchemaField({
                    category: new fields.NumberField({ required: true, integer: true }),
                    grouping: new fields.StringField({ required: true })
                })
            )
        };
    }

    /** Includes automatic BPModifiers  */
    get extendedBattleToggles() {
        const modifiers = CONFIG.DH.ENCOUNTER.BPModifiers;
        const adversaries =
            this.parent.turns?.filter(x => x.isNPC)?.map(x => ({ ...x.actor, type: x.actor.system.type })) ?? [];
        const characters = this.parent.turns?.filter(x => !x.isNPC) ?? [];

        const activeAutomatic = Object.keys(modifiers).reduce((acc, categoryKey) => {
            const category = modifiers[categoryKey];
            acc.push(
                ...Object.keys(category).reduce((acc, groupingKey) => {
                    const grouping = category[groupingKey];
                    if (grouping.automatic && grouping.conditional?.(this.parent, adversaries, characters)) {
                        acc.push({ category: Number(categoryKey), grouping: groupingKey });
                    }

                    return acc;
                }, [])
            );

            return acc;
        }, []);

        return [...this.battleToggles, ...activeAutomatic];
    }
}
