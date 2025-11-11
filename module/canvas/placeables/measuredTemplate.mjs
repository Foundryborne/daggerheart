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
        const sceneRangeMeasurement = canvas.scene.flags.daggerheart?.rangeMeasurement;

        const { disable, custom } = CONFIG.DH.GENERAL.sceneRangeMeasurementSetting;
        if (sceneRangeMeasurement.setting === disable.id) {
            result.distance = distanceValue;
            result.units = canvas.scene?.grid?.units;
            return result;
        }

        const melee = sceneRangeMeasurement.setting === custom.id ? sceneRangeMeasurement.melee : settings.melee;
        const veryClose =
            sceneRangeMeasurement.setting === custom.id ? sceneRangeMeasurement.veryClose : settings.veryClose;
        const close = sceneRangeMeasurement.setting === custom.id ? sceneRangeMeasurement.close : settings.close;
        const far = sceneRangeMeasurement.setting === custom.id ? sceneRangeMeasurement.far : settings.far;
        if (distanceValue <= melee) {
            result.distance = game.i18n.localize('DAGGERHEART.CONFIG.Range.melee.name');
            return result;
        }
        if (distanceValue <= veryClose) {
            result.distance = game.i18n.localize('DAGGERHEART.CONFIG.Range.veryClose.name');
            return result;
        }
        if (distanceValue <= close) {
            result.distance = game.i18n.localize('DAGGERHEART.CONFIG.Range.close.name');
            return result;
        }
        if (distanceValue <= far) {
            result.distance = game.i18n.localize('DAGGERHEART.CONFIG.Range.far.name');
            return result;
        }
        if (distanceValue > far) {
            result.distance = game.i18n.localize('DAGGERHEART.CONFIG.Range.veryFar.name');
        }

        return result;
    }
}
