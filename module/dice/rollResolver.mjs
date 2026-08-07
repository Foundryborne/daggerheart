export default class DhRollResolver extends foundry.applications.dice.RollResolver {
    /** @inheritDoc */
    async _prepareContext(_options) {
        const context = {
            formula: this.roll.formula,
            groups: {}
        };
        for (const fulfillable of this.fulfillable.values()) {
            const { id, term, method, isNew } = fulfillable;
            fulfillable.isNew = false;
            const config = CONFIG.Dice.fulfillment.methods[method];

            const dualityLabel = 
                term instanceof game.system.api.dice.diceTypes.HopeDie ? _loc(`DAGGERHEART.GENERAL.rollWith`, { roll: _loc(`DAGGERHEART.GENERAL.hope`) }) : 
                    term instanceof game.system.api.dice.diceTypes.FearDie ? _loc(`DAGGERHEART.GENERAL.rollWith`, { roll: _loc(`DAGGERHEART.GENERAL.fear`) }) : 
                        null;
            const label = dualityLabel ? `${dualityLabel} (${term.expression})` : term.expression;

            const group = context.groups[id] = {
                results: [],
                label,
                icon: config.icon ?? '<i class="fa-solid fa-bluetooth"></i>',
                tooltip: _loc(config.label)
            };
            const { denomination, faces } = term;
            const icon = CONFIG.Dice.fulfillment.dice[denomination]?.icon;
            for (let i = 0; i < Math.max(term.number ?? 1, term.results.length); i++) {
                const result = term.results[i];
                const { result: value, exploded, rerolled } = result ?? {};
                group.results.push({
                    denomination, id, method, icon, exploded, rerolled, isNew,
                    value: value ?? '',
                    minValue: denomination === 'c' ? 0 : 1,
                    maxValue: denomination === 'c' ? 1 : faces,
                    readonly: method !== 'manual',
                    disabled: !!result
                });
            }
        }
        return context;
    }
}