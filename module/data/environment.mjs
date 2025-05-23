export default class DhpEnvironment extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            resources: new fields.SchemaField({}),
            tier: new fields.StringField({ choices: Object.keys(SYSTEM.GENERAL.tiers), integer: false }),
            type: new fields.StringField({
                choices: Object.keys(SYSTEM.ACTOR.adversaryTypes),
                integer: false,
                initial: Object.keys(SYSTEM.ACTOR.adversaryTypes).find(x => x === 'standard')
            }),
            description: new fields.StringField({}),
            toneAndFeel: new fields.StringField({}),
            difficulty: new fields.NumberField({ initial: 1, integer: true }),
            potentialAdversaries: new fields.StringField({})
        };
    }

    get features() {
        return this.parent.items.filter(x => x.type === 'feature');
    }
}
