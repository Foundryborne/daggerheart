/** 
 * A class that batches and queues up reset requests for actors, 
 * while handling multiple reset requests for the same actor
 */
export class ResetBatch {
    #actors = new Set();

    /** Adds the actor to the reset batch and makes a sync request */
    reset(actor) {
        this.#actors.add(actor);
        this.#processSyncBatch();
    }

    #processSyncBatch = foundry.utils.debounce(() => {
        for (const actor of this.#actors) {
            actor.reset();
            actor.render();
        }
        this.#actors.clear();
    }, 10);
}
