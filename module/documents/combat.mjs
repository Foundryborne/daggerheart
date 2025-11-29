export default class DhpCombat extends Combat {
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
                    effects.map(effect => ({
                        ...effect,
                        name: game.i18n.localize(effect.name),
                        description: game.i18n.localize(effect.description)
                    }))
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
}
