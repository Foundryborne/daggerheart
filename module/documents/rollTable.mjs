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

    async toMessage(results, { roll, messageData = {}, messageOptions = {} } = {}) {
        messageOptions.rollMode ??= game.settings.get('core', 'rollMode');

        // Construct chat data
        messageData = foundry.utils.mergeObject(
            {
                author: game.user.id,
                speaker: foundry.documents.ChatMessage.implementation.getSpeaker(),
                rolls: [],
                sound: roll ? CONFIG.sounds.dice : null,
                flags: { 'core.RollTable': this.id }
            },
            messageData
        );
        if (roll) messageData.rolls.push(roll);

        // Render the chat card which combines the dice roll with the drawn results
        const detailsPromises = await Promise.allSettled(results.map(r => r.getHTML()));
        const flavorKey = `TABLE.DrawFlavor${results.length > 1 ? 'Plural' : ''}`;
        const flavor = game.i18n.format(flavorKey, {
            number: results.length,
            name: foundry.utils.escapeHTML(this.name)
        });
        messageData.content = await foundry.applications.handlebars.renderTemplate(CONFIG.RollTable.resultTemplate, {
            description: await TextEditor.implementation.enrichHTML(this.description, {
                documents: true,
                secrets: this.isOwner
            }),
            flavor: flavor,
            results: results.map((result, i) => {
                const r = result.toObject(false);
                r.details = detailsPromises[i].value ?? '';
                const useTableIcon =
                    result.icon === CONFIG.RollTable.resultIcon && this.img !== this.constructor.DEFAULT_ICON;
                r.icon = useTableIcon ? this.img : result.icon;
                return r;
            }),
            rollHTML: this.displayRoll && roll ? await roll.render() : null,
            table: this
        });

        // Create the chat message
        return foundry.documents.ChatMessage.implementation.create(messageData, messageOptions);
    }
}
