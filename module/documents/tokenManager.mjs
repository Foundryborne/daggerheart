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
        const tokenSizes = game.system.settings.homebrew.tokenSizes;
        if (actor?.system.metadata.usesSize) {
            const tokenSize = tokenSizes[actor.system.size];
            if (tokenSize && actor.system.size !== CONFIG.DH.ACTOR.tokenSize.custom.id) {
                tokenData.width = tokenSize;
                tokenData.height = tokenSize;
                tokenData.depth = tokenSize;
            }
        }

        const placedData = await canvas.tokens.placeTokens(
            [
                {
                    ...(await actor.getTokenDocument()).toObject(),
                    actorId: actor.id,
                    displayName: 50,
                    ...tokenData
                }
            ],
            { create: false }
        );

        return placedData?.[0] ?? null;
    }

    /**
     * Creates new tokens on the canvas by placing previews.
     * @param {object} tokenData
     * @param {object} options
     */
    async createTokensWithPreview(createData, { elevation } = {}) {
        const scene = game.scenes.get(game.user.viewedScene);
        if (!scene) return;

        const level = scene.levels.get(game.user.viewedLevel);
        if (!level) return;

        const createElevation = elevation ?? level.elevation.bottom;
        for (const data of createData) {
            const previewToken = await this.createPreview(data.actor, {
                ...data.tokenData,
                name: data.tokenPreviewName,
                level: game.user.viewedLevel,
                elevation: createElevation,
                flags: { 
                    daggerheart: { 
                        createPlacement: true,
                        previewSubtext: data.previewSubtext 
                    } 
                }
            });
            if (!previewToken) return false;

            const finalTokenData = {
                ...previewToken.toObject(),
                name: data.actor.prototypeToken.name,
                displayName: data.actor.prototypeToken.displayName,
                flags: data.actor.prototypeToken.flags
            };

            await canvas.scene.createEmbeddedDocuments(
                'Token',
                [finalTokenData],
                { controlObject: true, parent: canvas.scene }
            );
        }
    }
}
