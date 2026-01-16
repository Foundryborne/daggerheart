export default class DhRollTable extends foundry.documents.RollTable {
    async roll({ selectedFormula, roll, recursive = true, _depth = 0 } = {}) {
        // Prevent excessive recursion
        if (_depth > 5) {
            throw new Error(`Maximum recursion depth exceeded when attempting to draw from RollTable ${this.id}`);
        }

        const formula = selectedFormula ?? this.formula;

        // If there is no formula, automatically calculate an even distribution
        if (!this.formula) {
            await this.normalize();
        }

        // Reference the provided roll formula
        roll = roll instanceof Roll ? roll : Roll.create(formula);
        let results = [];

        // Ensure that at least one non-drawn result remains
        const available = this.results.filter(r => !r.drawn);
        if (!available.length) {
            ui.notifications.warn(game.i18n.localize('TABLE.NoAvailableResults'));
            return { roll, results };
        }

        // Ensure that results are available within the minimum/maximum range
        const minRoll = (await roll.reroll({ minimize: true })).total;
        const maxRoll = (await roll.reroll({ maximize: true })).total;
        const availableRange = available.reduce(
            (range, result) => {
                const r = result.range;
                if (!range[0] || r[0] < range[0]) range[0] = r[0];
                if (!range[1] || r[1] > range[1]) range[1] = r[1];
                return range;
            },
            [null, null]
        );
        if (availableRange[0] > maxRoll || availableRange[1] < minRoll) {
            ui.notifications.warn('No results can possibly be drawn from this table and formula.');
            return { roll, results };
        }

        // Continue rolling until one or more results are recovered
        let iter = 0;
        while (!results.length) {
            if (iter >= 10000) {
                ui.notifications.error(
                    `Failed to draw an available entry from Table ${this.name}, maximum iteration reached`
                );
                break;
            }
            roll = await roll.reroll();
            results = this.getResultsForRoll(roll.total);
            iter++;
        }

        // Draw results recursively from any inner Roll Tables
        if (recursive) {
            const inner = [];
            for (const result of results) {
                const { type, documentUuid } = result;
                const documentName = foundry.utils.parseUuid(documentUuid)?.type;
                if (type === 'document' && documentName === 'RollTable') {
                    const innerTable = await fromUuid(documentUuid);
                    if (innerTable) {
                        const innerRoll = await innerTable.roll({ _depth: _depth + 1 });
                        inner.push(...innerRoll.results);
                    }
                } else inner.push(result);
            }
            results = inner;
        }

        // Return the Roll and the results
        return { roll, results };
    }
}
