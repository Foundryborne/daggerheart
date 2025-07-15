import DHBaseAction from './baseAction.mjs';

export default class DHHealingAction extends DHBaseAction {
    static extraSchemas = ['target', 'effects', 'healing', 'roll'];

    static getRollType(parent) {
        return 'spellcast';
    }

    getFormulaValue(data) {
        let formulaValue = this.healing.value;
        if (this.hasRoll && this.healing.resultBased && data.system.roll.result.duality === -1)
            return this.healing.valueAlt;
        return formulaValue;
    }

    async rollHealing(event, data) {
        let formulaValue = this.getFormulaValue(data),
            formula = formulaValue.getFormula(this.actor);

        if (!formula || formula == '') return;
        let roll = { formula: formula, total: formula },
            bonusDamage = [];

        const config = {
            title: game.i18n.format('DAGGERHEART.UI.Chat.healingRoll.title', {
                healing: game.i18n.localize(CONFIG.DH.GENERAL.healingTypes[this.healing.type].label)
            }),
            roll: { formula },
            targets: (data.system?.targets ?? data.targets).filter(t => t.hit),
            messageType: 'healing',
            type: this.healing.type,
            event
        };

        roll = CONFIG.Dice.daggerheart.DamageRoll.build(config);
    }

    get chatTemplate() {
        return 'systems/daggerheart/templates/ui/chat/healing-roll.hbs';
    }

    get modifiers() {
        return [];
    }
}
