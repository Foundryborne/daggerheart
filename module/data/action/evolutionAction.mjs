import DHBaseAction from './baseAction.mjs';

export default class DHEvolutionAction extends DHBaseAction {
    static extraSchemas = [...super.extraSchemas, 'evolution', 'effects'];

    toggleEvolution(evolved = null) {
        evolved ??= !this.evolution.active;
        if (evolved) {
            return this.#evolve();
        } else {
            return this.#unevolve();
        }
    }
    
    /** @returns {typeof game.system.api.documents.DhToken | null} */
    #getMatchingToken() {
        const activeTokens = this.actor.getActiveTokens(false, true);
        const controlledMatchingTokens = canvas.tokens.controlled
            .filter(x => x.actor && x.actor.uuid === this.actor.uuid)
            .map(x => x.document);
        return this.actor.token ?? (
            activeTokens.length === 1 ? activeTokens[0] :
                (controlledMatchingTokens.length === 1 ? controlledMatchingTokens[0] : null)
        );

    }

    #evolve() {
        if (this.evolution.active) return;

        const token = this.#getMatchingToken();
        if (!token.actor) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.ACTIONS.TYPES.evolution.actorError'));
            return false;
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

    async #unevolve() {
        if (!this.evolution.active) return;

        const token = this.#getMatchingToken();
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
                scaleX: protoData.texture.scaleX,
                scaleY: protoData.texture.scaleY 
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
    }
}
