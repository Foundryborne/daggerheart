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
                texture: { 
                    src: protoData.texture.src, 
                    scaleX: protoData.texture.scale,
                    scaleY: protoData.texture.scale 
                },
                ring: {  
                    subject: { 
                        texture: protoData.ring.subject.texture, 
                        scale: protoData.ring.subject.scale 
                    },
                    colors: { 
                        ring: protoData.ring.colors.ring, 
                        background: protoData.ring.colors.background
                    },
                    effects: protoData.ring.effects
                }
            };

            this.update({ 'evolution.active': false });
            token.update(update, { diff: false, noHook: true });

            if (this.effects?.length) {
                const effectsToRemove = this.actor.effects.filter(x => {
                    const dhFlags = x.flags[CONFIG.DH.id];
                    return dhFlags?.[CONFIG.DH.FLAGS.activeEffectFlags.evolutionMarker]
                });

                if (effectsToRemove.length)
                    this.actor.deleteEmbeddedDocuments('ActiveEffect', effectsToRemove.map(x => x.id));
            }

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
                const usesColor = override.dynamicToken.ring || override.dynamicToken.background;
                if (override.dynamicToken.image || usesColor)
                    update.ring = {};

                if (usesColor) 
                    update.ring.colors = {};

                if (override.dynamicToken.image) 
                    update.ring.subject = { texture: override.dynamicToken.image, scale: override.dynamicToken.scale };

                if (override.dynamicToken.ring)
                    update.ring.colors.ring = override.dynamicToken.ring;
                
                if (override.dynamicToken.background)
                    update.ring.colors.background = override.dynamicToken.background;

                const dynamicEffects = override.dynamicToken.effects.reduce((acc, key) => {
                    return acc + (CONFIG.DH.ACTIONS.dynamicEffects[key]?.value ?? 0);
                }, 1);
                if (dynamicEffects > 1) 
                    update.ring.effects = dynamicEffects;
            } else if (override.tokenImage){
                update.texture = { 
                    src: override.tokenImage, 
                    scaleX: override.tokenScale,
                    scaleY: override.tokenScale
                };
            }

            if (Object.keys(update).length) {
                token.update(update, { diff: false, noHook: true });
            }
        }

        if (this.effects?.length) {
            const effectsToApply = this.effects.map(x => {
                const effect = this.item.effects.get(x._id);
                return {
                    ...effect.toObject(),
                    flags: {
                        [CONFIG.DH.id]: {
                            [CONFIG.DH.FLAGS.activeEffectFlags.evolutionMarker]: this.id
                        }
                    }
                }
            });
            this.actor.createEmbeddedDocuments('ActiveEffect', effectsToApply);
        }
    }
}