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
                const vagueLabel = this.constructor.getDistanceLabel(rulerValue, rangeMeasurementSettings);
                this.ruler.text = vagueLabel;
            }
        }
    }

    static getDistanceLabel(distance, settings) {
        if (distance <= settings.melee) {
            return game.i18n.localize('DAGGERHEART.CONFIG.Range.melee.name');
        }
        if (distance <= settings.veryClose) {
            return game.i18n.localize('DAGGERHEART.CONFIG.Range.veryClose.name');
        }
        if (distance <= settings.close) {
            return game.i18n.localize('DAGGERHEART.CONFIG.Range.close.name');
        }
        if (distance <= settings.far) {
            return game.i18n.localize('DAGGERHEART.CONFIG.Range.far.name');
        }
        if (distance > settings.far) {
            return game.i18n.localize('DAGGERHEART.CONFIG.Range.veryFar.name');
        }

        return '';
    }
}
