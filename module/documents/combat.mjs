export default class DhpCombat extends Combat {
    /** @inheritDoc */
    get nextCombatant() {
        return null;
    }

    async startCombat() {
        this._playCombatSound('startEncounter');
        const updateData = { round: 1, turn: null };
        Hooks.callAll('combatStart', this, updateData);
        await this.update(updateData);
        return this;
    }

    _sortCombatants(a, b) {
        const aNPC = Number(a.isNPC);
        const bNPC = Number(b.isNPC);
        if (aNPC !== bNPC) {
            return aNPC - bNPC;
        }

        return a.name.localeCompare(b.name);
    }

    async toggleModifierEffects(add, actors, category, groupingKey) {
        const effectData = category && groupingKey ? [{ category, grouping: groupingKey }] : this.system.battleToggles;
        if (add) {
            const effects = effectData.reduce((acc, toggle) => {
                const grouping = CONFIG.DH.ENCOUNTER.BPModifiers[toggle.category]?.[toggle.grouping];
                if (!grouping?.effects?.length) return acc;
                acc.push(
                    ...grouping.effects.map(effect => ({
                        ...effect,
                        name: game.i18n.localize(effect.name),
                        description: game.i18n.localize(effect.description),
                        effectTargetTypes: grouping.effectTargetTypes ?? [],
                        flags: {
                            [`${CONFIG.DH.id}.${CONFIG.DH.FLAGS.combatToggle}`]: {
                                category: toggle.category,
                                grouping: toggle.grouping
                            }
                        }
                    }))
                );

                return acc;
            }, []);

            if (!effects.length) return;

            for (let actor of actors) {
                await actor.createEmbeddedDocuments(
                    'ActiveEffect',
                    effects
                        .filter(x => x.effectTargetTypes.includes(actor.type))
                        .map(x => foundry.utils.deepClone(x))
                );
            }
        } else {
            for (let actor of actors) {
                await actor.deleteEmbeddedDocuments(
                    'ActiveEffect',
                    actor.effects
                        .filter(x => {
                            const flag = x.getFlag(CONFIG.DH.id, CONFIG.DH.FLAGS.combatToggle);
                            if (!flag) return false;
                            return effectData.some(
                                data => flag.category == data.category && flag.grouping === data.grouping
                            );
                        })
                        .map(x => x.id)
                );
            }
        }
    }

    /* -------------------------------------------- */
    /* Wholesale copied functions for minor changes */
    /* -------------------------------------------- */

    /** @inheritDoc */
    _onUpdate(changed, options, _userId) {
        const priorState = foundry.utils.deepClone(this.current);
        if (!this.previous) this.previous = priorState; // Just in case

        // Determine the new turn order
        if ('combatants' in changed) this.setupTurns(); // Update all combatants
        else {
            this.current = this._getCurrentState(); // Update turn or round
            if ((priorState.round === 0) && this.started) this.turns.forEach((c, i) => c.turnNumber = i);
        }

        // Record the prior state and manage turn events
        const stateChanged = this.#recordPreviousState(priorState);
        if (stateChanged && (options.turnEvents !== false)) this._manageTurnEvents();

        // Render applications for Actors involved in the Combat
        this.updateCombatantActors();

        // Render the CombatTracker sidebar
        const wasActivated = changed.active === true;
        if (wasActivated && this.isActive) ui.combat.render({combat: this});
        else if ('scene' in changed) ui.combat.render({combat: null});

        // Refresh token combat markers
        if (stateChanged || (wasActivated && this.isView)) this._updateTurnMarkers();

        // Trigger combat sound cues in the active encounter
        if (this.active && stateChanged && this.started && priorState.round && this.combatant) {
            /* DAGGERHEART: Removed 'play' check */
            this._playCombatSound('yourTurn');
        }
    }

    #recordPreviousState(priorState) {
        const {round, turn, combatantId} = this.current;
        const turnChange = (combatantId !== priorState.combatantId) || (round !== priorState.round)
        || (turn !== priorState.turn);
        Object.assign(this.previous, priorState);
        return turnChange;
    }
}
