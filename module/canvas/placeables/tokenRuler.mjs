import DhMeasuredTemplate from '../placeables/measuredTemplate.mjs';

export default class DhpTokenRuler extends foundry.canvas.placeables.tokens.TokenRuler {
    _getWaypointLabelContext(waypoint, state) {
        const context = super._getWaypointLabelContext(waypoint, state);
        if (!context) return;

        const range = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.variantRules).rangeMeasurement;

        if (range.enabled) {
            const distance = DhMeasuredTemplate.getDistanceLabel(waypoint.measurement.distance.toNearest(0.01), range);
            context.cost = { total: distance, units: null };
            context.distance = { total: distance, units: null };
        }

        return context;
    }
}
