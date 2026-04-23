export default class DhApplyActiveEffect extends CONFIG.RegionBehavior.dataModels.applyActiveEffect {
    static async #getApplicableEffects(token) {
        const effects = await Promise.all(this.effects.map(foundry.utils.fromUuid));
        return effects.filter(
            effect => !effect.system.targetDispositions.size || effect.system.targetDispositions.has(token.disposition)
        );
    }

    static async #onTokenEnter(event) {
        if (!event.user.isSelf) return;
        const { token, movement } = event.data;
        const actor = token.actor;
        if (!actor) return;
        const resumeMovement = movement ? token.pauseMovement() : undefined;
        const effects = await DhApplyActiveEffect.#getApplicableEffects.bind(this)(event.data.token);
        const toCreate = [];
        for (const effect of effects) {
            const data = effect.toObject();
            delete data._id;
            if (effect.compendium) {
                data._stats.duplicateSource = null;
                data._stats.compendiumSource = effect.uuid;
            } else {
                data._stats.duplicateSource = effect.uuid;
                data._stats.compendiumSource = null;
            }
            data._stats.exportSource = null;
            data.origin = this.parent.uuid;
            toCreate.push(data);
        }
        if (toCreate.length) await actor.createEmbeddedDocuments('ActiveEffect', toCreate);
        await resumeMovement?.();
    }

    /** @override */
    static events = {
        ...CONFIG.RegionBehavior.dataModels.applyActiveEffect.events,
        [CONST.REGION_EVENTS.TOKEN_ENTER]: this.#onTokenEnter
    };
}
