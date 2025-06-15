export default class DhpRuler extends foundry.canvas.interaction.Ruler {
    _getWaypointLabelContext(waypoint, state) {
        const context = super._getWaypointLabelContext(waypoint, state);
        if (!context) return;

        const range = game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.RangeMeasurement);

        if (range.enabled) {
            const distance = this.#getRangeLabel(waypoint.measurement.distance.toNearest(0.01), range);
            context.cost = { total: distance, units: null };
            context.distance = { total: distance, units: null };
        }

        return context;
    }

    #getRangeLabel(distance, settings) {
        if (distance <= settings.melee) {
            return game.i18n.localize('DAGGERHEART.Range.melee.name');
        }
        if (distance <= settings.veryClose) {
            return game.i18n.localize('DAGGERHEART.Range.veryClose.name');
        }
        if (distance <= settings.close) {
            return game.i18n.localize('DAGGERHEART.Range.close.name');
        }
        if (distance <= settings.far) {
            return game.i18n.localize('DAGGERHEART.Range.far.name');
        }
        if (distance <= settings.veryFar) {
            return game.i18n.localize('DAGGERHEART.Range.veryFar.name');
        }
    }
}
