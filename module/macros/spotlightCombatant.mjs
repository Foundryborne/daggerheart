/**
 * Spotlights a combatant.
 * The combatant can be selected in a number of ways. If many are applied at the same time, the following order is used:
 * 1) SelectedCombatant
 * 2) HoveredCombatant
 */
const spotlightCombatant = () => {
    if (!game.combat)
        return ui.notifications.error(game.i18n.localize('DAGGERHEART.MACROS.Spotlight.errors.noActiveCombat'));

    const selectedCombatant = canvas.tokens.controlled.length > 0 ? canvas.tokens.controlled[0].combatant : null;
    const hoveredCombatant = game.canvas.tokens.hover?.combatant;

    const combatant = selectedCombatant ?? hoveredCombatant;
    if (!combatant)
        return ui.notifications.error(game.i18n.localize('DAGGERHEART.MACROS.Spotlight.errors.noCombatantSelected'));

    ui.combat.setCombatantSpotlight(combatant.id);
};

export default spotlightCombatant;
