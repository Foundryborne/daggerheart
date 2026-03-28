/**
 * Spotlight a token on the canvas. If it is a combatant, run it through combatTracker's spotlight logic.
 * @param {TokenDocument} token - The token to spotlight
 * @returns {void}
 */
const spotlightCombatantMacro = token => {
    if (!token)
        return ui.notifications.error(game.i18n.localize('DAGGERHEART.MACROS.Spotlight.errors.noTokenSelected'));

    if (game.combat && token.combatant) {
        ui.combat.setCombatantSpotlight(token.combatant.id);
    } else {
        if (game.combat) ui.combat.clearTurn();
        spotlightToken(token.document);
    }
};

/**
 * Spotlight a token on the canvas.
 * @param {TokenDocument} token - The token to spotlight
 * @returns {void}
 */
export const spotlightToken = async token => {
    const spotlightTracker = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.SpotlightTracker);
    let previouslySpotlightedUuid = null;
    const isSpotlighted = spotlightTracker.spotlightedTokens.has(token.uuid);
    if (!isSpotlighted && spotlightTracker.spotlightedTokens.size > 0) {
        previouslySpotlightedUuid = spotlightTracker.spotlightedTokens.first();
    }

    spotlightTracker.updateSource({
        spotlightedTokens: isSpotlighted ? [] : [token.uuid]
    });

    await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.SpotlightTracker, spotlightTracker);
    token.object.renderFlags.set({ refreshTurnMarker: true });

    if (previouslySpotlightedUuid) {
        const previousToken = await foundry.utils.fromUuid(previouslySpotlightedUuid);
        previousToken.object.renderFlags.set({ refreshTurnMarker: true });
    }
};

export default spotlightCombatantMacro;
