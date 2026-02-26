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
        if (!settings.enabled) return result;

        const sceneRangeMeasurement = canvas.scene.flags.daggerheart?.rangeMeasurement;
        const { disable, custom } = CONFIG.DH.GENERAL.sceneRangeMeasurementSetting;
        if (sceneRangeMeasurement?.setting === disable.id) {
            result.distance = distanceValue;
            result.units = canvas.scene?.grid?.units;
            return result;
        }

        const ranges = sceneRangeMeasurement?.setting === custom.id ? sceneRangeMeasurement : settings;
        const distanceKey = ['melee', 'veryClose', 'close', 'far'].find(r => ranges[r] >= distanceValue);
        result.distance = game.i18n.localize(`DAGGERHEART.CONFIG.Range.${distanceKey ?? 'veryFar'}.name`);
        return result;
    }
}
