/**
 * A singleton class that handles creating tokens.
 */

export default class DhTokenManager {
    /**
     * Create a token previer
     * @param {Actor} actor
     * @param {object} tokenData
     */
    async createPreview(actor, tokenData) {
        const tokenSizes = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).tokenSizes;
        if (actor?.system.metadata.usesSize) {
            const tokenSize = tokenSizes[actor.system.size];
            if (tokenSize && actor.system.size !== CONFIG.DH.ACTOR.tokenSize.custom.id) {
                tokenData.width = tokenSize;
                tokenData.height = tokenSize;
            }
        }

        return await canvas.tokens.placeTokens(
            [
                {
                    ...actor.prototypeToken.toObject(),
                    actorId: actor.id,
                    displayName: 50,
                    ...tokenData
                }
            ],
            { create: false }
        );
    }

    /**
     * Creates new tokens on the canvas by placing previews.
     * @param {object} tokenData
     * @param {object} options
     */
    async createTokensWithPreview(tokensData, { elevation } = {}) {
        const scene = game.scenes.get(game.user.viewedScene);
        if (!scene) return;

        const level = scene.levels.get(game.user.viewedLevel);
        if (!level) return;

        const createElevation = elevation ?? level.elevation.bottom;
        for (const tokenData of tokensData) {
            const previewTokens = await this.createPreview(tokenData.actor, {
                name: tokenData.tokenPreviewName,
                level: game.user.viewedLevel,
                elevation: createElevation,
                flags: { daggerheart: { createPlacement: true } }
            });
            if (!previewTokens?.length) return null;

            await canvas.scene.createEmbeddedDocuments(
                'Token',
                previewTokens.map(x => ({
                    ...x.toObject(),
                    name: tokenData.actor.prototypeToken.name,
                    displayName: tokenData.actor.prototypeToken.displayName,
                    flags: tokenData.actor.prototypeToken.flags
                })),
                { controlObject: true, parent: canvas.scene }
            );
        }
    }
}
