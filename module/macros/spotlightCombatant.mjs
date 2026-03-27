/**
 * Spotlights a combatant.
 * The combatant can be selected in a number of ways. If many are applied at the same time, the following order is used:
 * 1) SelectedCombatant
 * 2) HoveredCombatant
 */
const spotlightCombatant = () => {
    const selectedTokens = canvas.tokens.controlled.length > 0 ? canvas.tokens.controlled : [];
    const hoveredTokens = game.canvas.tokens.hover ? [game.canvas.tokens.hover] : [];

    const tokens = selectedTokens.length ? selectedTokens : hoveredTokens;
    if (!tokens.length)
        return ui.notifications.error(game.i18n.localize('DAGGERHEART.MACROS.Spotlight.errors.noCombatantSelected'));

    const spotlightTracker = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.SpotlightTracker);
    spotlightTracker.updateSource();

    for (const token of tokens) {
        if (game.combat && token.combatant) {
            ui.combat.setCombatantSpotlight(token.combatant.id);
        } else {
            const isSpotlighted = spotlightTracker.spotlightedTokens.has(token.document.uuid);
            spotlightTracker.updateSource({
                spotlightedTokens: isSpotlighted
                    ? [...spotlightTracker.spotlightedTokens].filter(x => x !== token.document.uuid)
                    : [...spotlightTracker.spotlightedTokens, token.document.uuid]
            });
        }
    }

    game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.SpotlightTracker, spotlightTracker);
    for (const token of tokens) {
        token.renderFlags.set({ refreshTurnMarker: true });
    }
};

export default spotlightCombatant;
