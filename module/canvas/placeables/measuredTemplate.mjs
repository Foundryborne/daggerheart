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
                this.ruler.text = result.distance + (result.units ? (' ' + result.units) : '');
            }
        }
    }

    static getRangeLabels(distanceValue, settings) {
        let result = { distance: distanceValue, units: '' }
        const rangeMeasurementOverride = canvas.scene.flags.daggerheart?.rangeMeasurementOverride;

        if (rangeMeasurementOverride === true) {
            result.distance = distanceValue;
            result.units = canvas.scene?.grid?.units;
            return result
        }
        if (distanceValue <= settings.melee) {
            result.distance = game.i18n.localize('DAGGERHEART.CONFIG.Range.melee.name');
            return result;
        }
        if (distanceValue <= settings.veryClose) {
            result.distance = game.i18n.localize('DAGGERHEART.CONFIG.Range.veryClose.name');
            return result;
        }
        if (distanceValue <= settings.close) {
            result.distance = game.i18n.localize('DAGGERHEART.CONFIG.Range.close.name');
            return result;
        }
        if (distanceValue <= settings.far) {
            result.distance = game.i18n.localize('DAGGERHEART.CONFIG.Range.far.name');
            return result;
        }
        if (distanceValue > settings.far) {
            result.distance = game.i18n.localize('DAGGERHEART.CONFIG.Range.veryFar.name');
        }

        return result;
    }
}
