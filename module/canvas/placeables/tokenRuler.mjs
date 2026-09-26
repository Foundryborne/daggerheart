import { measureExact } from '../../helpers/utils.mjs';
import DhMeasuredTemplate from '../placeables/measuredTemplate.mjs';

export default class DhpTokenRuler extends foundry.canvas.placeables.tokens.TokenRuler {
    _getWaypointLabelContext(waypoint, state) {
        const context = super._getWaypointLabelContext(waypoint, state);
        if (!context) return;

        const range = canvas.scene.rangeSettings;
        if (range.enabled) {
            const distance = measureExact(
                { x: waypoint.x, y: waypoint.y, z: waypoint.elevation },
                { x: waypoint.previous.x, y: waypoint.previous.y, z: waypoint.previous.z},
                { grid: canvas.grid }
            );
            const result = DhMeasuredTemplate.getRangeLabels(distance, range);
            context.cost = { total: result.distance, units: result.units };
            context.distance = { total: result.distance, units: result.units };
        }

        return context;
    }
}
