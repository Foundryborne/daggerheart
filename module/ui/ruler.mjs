export default class DhpRuler extends foundry.canvas.interaction.Ruler {
    _getSegmentLabel(segment, totalDistance) {
        const range = game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.General.RangeMeasurement);
        if (!range.enabled) return super._getSegmentLabel(segment, totalDistance);

        const segmentDistance = Math.round(segment.distance * 100) / 100;
        const totalDistanceValue = Math.round(totalDistance * 100) / 100;

        return `${this.#getRangeLabel(segmentDistance, range)} [${this.#getRangeLabel(totalDistanceValue, range)}]`;
    }

    #getRangeLabel(distance, settings) {
        if (distance <= settings.melee) {
            return game.i18n.localize('DAGGERHEART.Range.Melee.Name');
        }
        if (distance <= settings.veryClose) {
            return game.i18n.localize('DAGGERHEART.Range.VeryClose.Name');
        }
        if (distance <= settings.close) {
            return game.i18n.localize('DAGGERHEART.Range.Close.Name');
        }
        if (distance <= settings.far) {
            return game.i18n.localize('DAGGERHEART.Range.Far.Name');
        }
        if (distance <= settings.veryFar) {
            return game.i18n.localize('DAGGERHEART.Range.VeryFar.Name');
        }
    }
}
