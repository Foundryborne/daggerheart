export default class DhScene extends Scene {
    /** A map of `TokenDocument` IDs embedded in this scene long with new dimensions from actor size-category changes */
    #sizeSyncBatch = new Map();

    /** Synchronize a token's dimensions with its actor's size category. */
    syncTokenDimensions(tokenDoc, dimensions) {
        if (!tokenDoc.parent?.tokens.has(tokenDoc.id)) return;
        this.#sizeSyncBatch.set(tokenDoc.id, dimensions);
        this.#processSyncBatch();
    }

    /** Retrieve size and clear size-sync batch, make updates. */
    #processSyncBatch = foundry.utils.debounce(() => {
        const tokenSizes = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).tokenSizes;
        const entries = this.#sizeSyncBatch
            .entries()
            .toArray()
            .map(([_id, { width, height }]) => ({ _id, width: tokenSizes[width], height: tokenSizes[height] }));
        this.#sizeSyncBatch.clear();
        this.updateEmbeddedDocuments('Token', entries, { animation: { movementSpeed: 1 } });
    }, 0);
}
