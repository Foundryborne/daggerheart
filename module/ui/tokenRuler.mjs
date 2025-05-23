export default class DhpTokenRuler extends foundry.canvas.placeables.tokens.TokenRuler {
    _getWaypointLabelContext(waypoint, state) {
        const context = super._getWaypointLabelContext(waypoint, state);
        if (!context) return;

        const range = game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.General.RangeMeasurement);

        if (range.enabled) {
            const distance = this.#getRangeLabel(waypoint.measurement.distance.toNearest(0.01), range);
            context.cost = { total: distance, units: null };
            context.distance = { total: distance, units: null };
        }

        return context;
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
