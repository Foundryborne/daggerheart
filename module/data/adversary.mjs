export default class DhpAdversary extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            resources: new fields.SchemaField({
                health: new fields.SchemaField({
                    value: new fields.NumberField({ initial: 0, integer: true }),
                    min: new fields.NumberField({ initial: 0, integer: true }),
                    max: new fields.NumberField({ initial: 0, integer: true })
                }),
                stress: new fields.SchemaField({
                    value: new fields.NumberField({ initial: 0, integer: true }),
                    min: new fields.NumberField({ initial: 0, integer: true }),
                    max: new fields.NumberField({ initial: 0, integer: true })
                })
            }),
            tier: new fields.StringField({ choices: Object.keys(SYSTEM.GENERAL.tiers), integer: false }),
            type: new fields.StringField({
                choices: Object.keys(SYSTEM.ACTOR.adversaryTypes),
                integer: false,
                initial: Object.keys(SYSTEM.ACTOR.adversaryTypes).find(x => x === 'standard')
            }),
            description: new fields.StringField({}),
            motivesAndTactics: new fields.ArrayField(new fields.StringField({})),
            attackModifier: new fields.NumberField({ integer: true, nullabe: true, initial: null }),
            attack: new fields.SchemaField({
                name: new fields.StringField({}),
                range: new fields.StringField({ choices: Object.keys(SYSTEM.GENERAL.range), integer: false }),
                damage: new fields.SchemaField({
                    value: new fields.StringField({}),
                    type: new fields.StringField({ choices: Object.keys(SYSTEM.GENERAL.damageTypes), integer: false })
                })
            }),
            difficulty: new fields.NumberField({ initial: 1, integer: true }),
            damageThresholds: new fields.SchemaField({
                major: new fields.NumberField({ initial: 0, integer: true }),
                severe: new fields.NumberField({ initial: 0, integer: true })
            }),
            experiences: new fields.TypedObjectField(
                new fields.SchemaField({
                    id: new fields.StringField({ required: true }),
                    name: new fields.StringField(),
                    value: new fields.NumberField({ integer: true, nullable: true, initial: null })
                })
            )
        };
    }

    get features() {
        return this.parent.items.filter(x => x.type === 'feature');
    }
}
