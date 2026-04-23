export default class DhActorCollection extends foundry.documents.collections.Actors {
    /** @returns the active party */
    get party() {
        const id = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.ActiveParty);
        const actor = game.actors.get(id);
        return actor?.type === 'party' ? actor : null;
    }

    /** Ensure companions are initialized after all other subtypes. */
    _initialize() {
        super._initialize();
        const companions = [];
        for (const actor of this.values()) {
            if (actor.type === 'companion') companions.push(actor);
        }
        for (const actor of companions) {
            this.delete(actor.id);
            this.set(actor.id, actor);
        }
    }
}
