export default class DhTokenLayer extends foundry.canvas.layers.TokenLayer {
    async _createPreview(createData, options) {
        if (options.actor) {
            const tokenSizes = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).tokenSizes;
            if (options.actor?.system.metadata.usesSize) {
                const tokenSize = tokenSizes[options.actor.system.size];
                if (tokenSize && options.actor.system.size !== CONFIG.DH.ACTOR.tokenSize.custom.id) {
                    createData.width = tokenSize;
                    createData.height = tokenSize;
                }
            }
        }

        return super._createPreview(createData, options);
    }
}
