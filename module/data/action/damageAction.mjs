import DHBaseAction from './baseAction.mjs';

export default class DHDamageAction extends DHBaseAction {
    static extraSchemas = ['damage', 'target', 'effects'];

    getFormulaValue(part, data) {
        let formulaValue = part.value;
        if (this.hasRoll && part.resultBased && data.system.roll.result.duality === -1) return part.valueAlt;
        return formulaValue;
    }

    async rollDamage(event, data) {
        let formula = this.damage.parts.map(p => this.getFormulaValue(p, data).getFormula(this.actor)).join(' + '),
            damageTypes = [...new Set(this.damage.parts.reduce((a, c) => a.concat([...c.type]), []))];

        damageTypes = !damageTypes.length ? ['physical'] : damageTypes;

        if (!formula || formula == '') return;
        let roll = { formula: formula, total: formula },
            bonusDamage = [];

        if (isNaN(formula)) formula = Roll.replaceFormulaData(formula, this.getRollData(data.system ?? data));

        const config = {
            title: game.i18n.format('DAGGERHEART.UI.Chat.damageRoll.title', { damage: this.name }),
            roll: { formula },
            targets: data.system?.targets.filter(t => t.hit) ?? data.targets,
            hasSave: this.hasSave,
            isCritical: data.system?.roll?.isCritical ?? false,
            source: data.system?.source,
            damageTypes,
            event
        };
        if (this.hasSave) config.onSave = this.save.damageMod;
        if (data.system) {
            config.source.message = data._id;
            config.directDamage = false;
        }

        roll = CONFIG.Dice.daggerheart.DamageRoll.build(config);
    }
}
