import DHToken from './token.mjs';

export default class DhScene extends Scene {
    /** A map of `TokenDocument` IDs embedded in this scene long with new dimensions from actor size-category changes */
    #sizeSyncBatch = new Map();

    /** Synchronize a token's dimensions with its actor's size category. */
    syncTokenDimensions(tokenDoc, tokenSize) {
        if (!tokenDoc.parent?.tokens.has(tokenDoc.id)) return;
        const prototype = tokenDoc.actor?.prototypeToken ?? tokenDoc;
        this.#sizeSyncBatch.set(tokenDoc.id, {
            size: tokenSize,
            prototypeSize: { width: prototype.width, height: prototype.height },
            position: { x: tokenDoc.x, y: tokenDoc.y, elevation: tokenDoc.elevation }
        });
        this.#processSyncBatch();
    }

    /** Retrieve size and clear size-sync batch, make updates. */
    #processSyncBatch = foundry.utils.debounce(() => {
        const tokenSizes = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).tokenSizes;
        const entries = this.#sizeSyncBatch
            .entries()
            .toArray()
            .map(([_id, { size, prototypeSize, position }]) => {
                const tokenSize = tokenSizes[size];
                const width = size !== CONFIG.DH.ACTOR.tokenSize.custom.id ? tokenSize : prototypeSize.width;
                const height = size !== CONFIG.DH.ACTOR.tokenSize.custom.id ? tokenSize : prototypeSize.height;
                const updatedPosition = DHToken.getSnappedPositionInSquareGrid(this.grid, position, width, height);
                return {
                    _id,
                    width,
                    height,
                    ...updatedPosition
                };
            });
        this.#sizeSyncBatch.clear();
        this.updateEmbeddedDocuments('Token', entries, { animation: { movementSpeed: 1.5 } });
    }, 0);
}
