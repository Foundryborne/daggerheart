const fields = foundry.data.fields;
export default class DHEvolutionField extends fields.SchemaField {
    /**
     * Action Workflow order
     */
    static order = 130;

    constructor(options = {}, context = {}) {
        const evolutionFields = {
            active: new fields.BooleanField({ required: true, nullable: false, initial: false }),
            evolutionFeatures: new fields.TypedObjectField(new fields.StringField({  
                required: true,
                nullable: false,
                choices: CONFIG.DH.ACTIONS.evolutionStates,
                initial: CONFIG.DH.ACTIONS.evolutionStates.evolved.id
            })),
            resourceRefresh: new fields.SchemaField({
                hitPoints: new fields.BooleanField({ initial: true }),
                stress: new fields.BooleanField({ initial: true })
            })
        };
        super(evolutionFields, options, context);
    }

    static async execute() {
        this.update({ 'evolution.active': !this.evolution.active });

        const resourceUpdate = { resources: {} };
        if (this.evolution.resourceRefresh.hitPoints) {
            resourceUpdate.resources.hitPoints = { key: 'hitPoints', options: { fullRestore: true }}
        }
        if (this.evolution.resourceRefresh.stress) {
            resourceUpdate.resources.stress = { key: 'stress', options: { fullRestore: true }}
        }
        if (Object.keys(resourceUpdate.resources).length) {
            this.actor.takeHealing(resourceUpdate);
        }
    }
}