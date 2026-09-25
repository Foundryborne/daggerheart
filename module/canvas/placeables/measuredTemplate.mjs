export default class DhMeasuredTemplate extends foundry.canvas.placeables.MeasuredTemplate {
    _refreshRulerText() {
        super._refreshRulerText();

        const rangeMeasurementSettings = game.settings.get(
            CONFIG.DH.id,
            CONFIG.DH.SETTINGS.gameSettings.variantRules
        ).rangeMeasurement;
        if (rangeMeasurementSettings.enabled) {
            const splitRulerText = this.ruler.text.split(' ');
            if (splitRulerText.length > 0) {
                const rulerValue = Number(splitRulerText[0]);
                const result = DhMeasuredTemplate.getRangeLabels(rulerValue, rangeMeasurementSettings);
                this.ruler.text = result.distance + (result.units ? ' ' + result.units : '');
            }
        }
    }

    static getRangeLabels(distanceValue, settings) {
        let result = { distance: distanceValue, units: '' };
        if (!settings.enabled || !canvas.scene) return result;

        const ranges = canvas.scene.rangeSettings;
        if (!ranges.enabled) {
            result.distance = distanceValue;
            result.units = canvas.scene?.grid?.units;
            return result;
        }

        distanceValue = Math.round(distanceValue / canvas.grid.distance) * canvas.grid.distance; // round down to nearest 5 
        const distanceKey = ['melee', 'veryClose', 'close', 'far'].find(r => ranges[r] >= distanceValue);
        result.distance = game.i18n.localize(`DAGGERHEART.CONFIG.Range.${distanceKey ?? 'veryFar'}.name`);
        return result;
    }
}
