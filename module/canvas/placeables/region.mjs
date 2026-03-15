import DhMeasuredTemplate from './measuredTemplate.mjs';

export default class DhRegion extends foundry.canvas.placeables.Region {
    /**@inheritdoc */
    _formatMeasuredDistance(distance) {
        const range = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.variantRules).rangeMeasurement;
        if (!range.enabled) return super._formatMeasuredDistance(distance);

        const { distance: resultDistance, units } = DhMeasuredTemplate.getRangeLabels(distance, range);
        return `${resultDistance} ${units}`;
    }
}
