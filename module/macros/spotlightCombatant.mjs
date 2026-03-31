/**
 * Spotlight a token on the canvas. If it is a combatant, run it through combatTracker's spotlight logic.
 * @param {TokenDocument} token - The token to spotlight
 * @returns {void}
 */
const spotlightCombatantMacro = async token => {
    if (!token)
        return ui.notifications.error(game.i18n.localize('DAGGERHEART.MACROS.Spotlight.errors.noTokenSelected'));

    const combatantCombat = token.combatant
        ? game.combat
        : game.combats.find(combat => combat.combatants.some(x => x.token && x.token.id === token.document.id));
    if (combatantCombat) {
        const combatant = combatantCombat.combatants.find(x => x.token.id === token.document.id);
        if (!combatantCombat.active) {
            await combatantCombat.activate();
            if (combatantCombat.combatant?.id !== combatant.id) ui.combat.setCombatantSpotlight(combatant.id);
        } else {
            ui.combat.setCombatantSpotlight(combatant.id);
        }
    } else {
        if (game.combat) await ui.combat.clearTurn();

        const spotlightTracker = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.SpotlightTracker);
        const isSpotlighted = spotlightTracker.spotlightedTokens.has(token.document.uuid);
        if (!isSpotlighted) await clearPreviousSpotlight();

        spotlightTracker.updateSource({
            spotlightedTokens: isSpotlighted ? [] : [token.document.uuid]
        });

        await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.SpotlightTracker, spotlightTracker);
        token.renderFlags.set({ refreshTurnMarker: true });
    }
};

export const clearPreviousSpotlight = async () => {
    const spotlightTracker = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.SpotlightTracker);
    const previouslySpotlightedUuid =
        spotlightTracker.spotlightedTokens.size > 0 ? spotlightTracker.spotlightedTokens.first() : null;
    if (!previouslySpotlightedUuid) return;

    spotlightTracker.updateSource({ spotlightedTokens: [] });
    await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.SpotlightTracker, spotlightTracker);

    const previousToken = await foundry.utils.fromUuid(previouslySpotlightedUuid);
    previousToken.object.renderFlags.set({ refreshTurnMarker: true });
};

export default spotlightCombatantMacro;
