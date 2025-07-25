import DHBaseAction from './baseAction.mjs';

export default class DHHealingAction extends DHBaseAction {
    static extraSchemas = [...super.extraSchemas, 'target', 'effects', 'healing', 'roll'];

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
        const systemData = data.system ?? data;
        let formulas = [
            {
                formula: this.getFormulaValue(data).getFormula(this.actor),
                applyTo: this.healing.applyTo
            }
        ];

        const config = {
            title: game.i18n.format('DAGGERHEART.UI.Chat.healingRoll.title', {
                healing: game.i18n.localize(CONFIG.DH.GENERAL.healingTypes[this.healing.applyTo].label)
            }),
            roll: formulas,
            targets: systemData.targets?.filter(t => t.hit),
            messageType: 'healing',
            source: systemData.source,
            data: this.getRollData(),
            event
        };

        return CONFIG.Dice.daggerheart.DamageRoll.build(config);
    }

    get chatTemplate() {
        return 'systems/daggerheart/templates/ui/chat/healing-roll.hbs';
    }

    get modifiers() {
        return [];
    }
}
