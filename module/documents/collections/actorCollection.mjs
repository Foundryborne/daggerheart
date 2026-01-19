export default class DhActorCollection extends foundry.documents.collections.Actors {
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
