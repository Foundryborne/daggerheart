const fields = foundry.data.fields;

/**
 * @import DHEvolutionAction from '../../action/evolutionAction.mjs'
 */

export default class DHEvolutionField extends fields.SchemaField {
    /**
     * Action Workflow order
     */
    static order = 130;

    constructor(options = {}, context = {}) {
        const evolutionFields = {
            // Handled by the existing of an effect
            active: new fields.BooleanField({ required: true, nullable: false, initial: false}),
            evolutionFeatures: new fields.TypedObjectField(new fields.StringField({  
                required: true,
                nullable: false,
                choices: CONFIG.DH.ACTIONS.evolutionStates,
                initial: CONFIG.DH.ACTIONS.evolutionStates.evolved.id
            })),
            resourceRefresh: new fields.SchemaField({
                hitPoints: new fields.BooleanField({ initial: true }),
                stress: new fields.BooleanField({ initial: true })
            }),
            tokenOverride: new fields.SchemaField({  
                tokenImage: new fields.FilePathField({
                    label: 'DAGGERHEART.ACTIONS.TYPES.evolution.tokenImage',
                    categories: ['IMAGE'],
                    base64: false
                }),
                tokenScale: new fields.NumberField({
                    label: 'DAGGERHEART.ACTIONS.TYPES.evolution.tokenScale',
                    min: 0.2,
                    max: 3,
                    step: 0.05,
                    initial: 1
                }),
                dynamicToken: new fields.SchemaField({
                    image: new fields.FilePathField({
                        label: 'DAGGERHEART.ACTIONS.TYPES.evolution.dynamicTokenImage',
                        categories: ['IMAGE'],
                        base64: false
                    }),
                    scale: new fields.NumberField({
                        label: 'TOKEN.FIELDS.ring.subject.scale.label',
                        min: 0.2,
                        max: 3,
                        step: 0.05,
                        initial: 1
                    }),
                    ring: new fields.ColorField({
                        label: 'DAGGERHEART.ACTIONS.TYPES.evolution.dynamicTokenRing'
                    }),
                    background: new fields.ColorField({
                        label: 'DAGGERHEART.ACTIONS.TYPES.evolution.dynamicTokenBackground'
                    }),
                    effects: new fields.SetField(new fields.StringField({
                        choices: CONFIG.DH.ACTIONS.dynamicEffects
                    }))
                })
            }, { nullable: true, initial: null, label: 'DAGGERHEART.ACTIONS.TYPES.evolution.dynamicEffects' })
        };
        super(evolutionFields, options, context);
    }

    /**
     * Runs the execute. This is run on behalf of DHSummonAction.
     * @todo move this function to be on the summon action.
     * @this DHEvolutionAction
     */
    static async execute() {
        this.toggleEvolution();
    }
}