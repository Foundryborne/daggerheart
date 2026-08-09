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
            }),
            tokenOverride: new fields.SchemaField({  
                tokenImage: new fields.FilePathField({
                    label: 'DAGGERHEART.ACTIONS.TYPES.evolution.tokenImage',
                    categories: ['IMAGE'],
                    base64: false
                }),
                dynamicTokenImage: new fields.FilePathField({
                    label: 'DAGGERHEART.ACTIONS.TYPES.evolution.dynamicTokenImage',
                    categories: ['IMAGE'],
                    base64: false
                }),
                dynamicTokenRing: new fields.ColorField({
                    label: 'DAGGERHEART.ACTIONS.TYPES.evolution.dynamicTokenRing'
                }),
                dynamicTokenBackground: new fields.ColorField({
                    label: 'DAGGERHEART.ACTIONS.TYPES.evolution.dynamicTokenBackground'
                }),
                dynamicTokenEffects: new fields.SetField(new fields.StringField({
                    choices: CONFIG.DH.ACTIONS.dynamicEffects
                }))
            }, { nullable: true, initial: null, label: 'DAGGERHEART.ACTIONS.TYPES.evolution.dynamicEffects' })
        };
        super(evolutionFields, options, context);
    }

    static async execute() {
        const activeTokens = this.actor.getActiveTokens(false, true);
        const controlledMatchingTokens = canvas.tokens.controlled
            .filter(x => x.actor && x.actor.uuid === this.actor.uuid)
            .map(x => x.document);
        /** @type {typeof game.system.api.documents.DhToken | null} */
        const token = this.actor.token ?? (
            activeTokens.length === 1 ? activeTokens[0] :
                (controlledMatchingTokens.length === 1 ? controlledMatchingTokens[0] : null)
        );

        if (!token) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.ACTIONS.TYPES.evolution.tokenError'));
            return false;
        }

        if (this.evolution.active) {
            if (!token.actor) {
                ui.notifications.warn(game.i18n.localize('DAGGERHEART.ACTIONS.TYPES.evolution.actorError'));
                return false;
            }

            const confirmed = await foundry.applications.api.DialogV2.confirm({
                window: {
                    title: game.i18n.localize('DAGGERHEART.ACTIONS.TYPES.evolution.deevolveConfirmationTitle')
                },
                content: game.i18n.format('DAGGERHEART.ACTIONS.TYPES.evolution.deevolveConfirmationText')
            });

            if (!confirmed) return false; 

            const protoData = token.actor.prototypeToken;
            const update = {
                texture: { src: protoData.texture.src },
                ring: {  
                    subject: { texture: protoData.ring.subject.texture },
                    colors: { 
                        ring: protoData.ring.colors.ring, 
                        background: protoData.ring.colors.background
                    },
                    effects: protoData.ring.effects
                }
            };

            this.update({ 'evolution.active': false });
            token.update(update, { diff: false, noHook: true });
            return;
        }

        this.update({ 'evolution.active': true });

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

        if (this.evolution.tokenOverride) {
            const override = this.evolution.tokenOverride;
            const update = { };

            if (token.ring.enabled) {
                const usesColor = override.dynamicTokenRing || override.dynamicTokenBackground;
                if (override.dynamicTokenImage || usesColor)
                    update.ring = {};

                if (usesColor) 
                    update.ring.colors = {};

                if (override.dynamicTokenImage) 
                    update.ring.subject = { texture: override.dynamicTokenImage };

                if (override.dynamicTokenRing)
                    update.ring.colors.ring = override.dynamicTokenRing;
                
                if (override.dynamicTokenBackground)
                    update.ring.colors.background = override.dynamicTokenBackground;

                const dynamicEffects = override.dynamicTokenEffects.reduce((acc, key) => {
                    return acc + (CONFIG.DH.ACTIONS.dynamicEffects[key]?.value ?? 0);
                }, 1);
                if (dynamicEffects > 1) 
                    update.ring.effects = dynamicEffects;
            } else if (override.tokenImage){
                update.texture = { src: override.tokenImage };
            }

            if (Object.keys(update).length) {
                token.update(update, { diff: false, noHook: true });
            }
        }
    }
}