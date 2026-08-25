import { getDiceSoNiceSFX } from '../config/generalConfig.mjs';

export default class BaseRoll extends foundry.dice.Roll {
    /** @inheritdoc */
    static CHAT_TEMPLATE = 'systems/daggerheart/templates/ui/chat/foundryRoll.hbs';

    /** @inheritdoc */
    static TOOLTIP_TEMPLATE = 'systems/daggerheart/templates/ui/chat/foundryRollTooltip.hbs';

    get modifierTotal() {
        return this.total - this.dice.reduce((acc, dice) => acc + dice.total, 0);
    }

    async _evaluate(options) {
        await super._evaluate(options);
        
        if (game.dice3d) {
            const hopeRoll = this.dice.find(x => x.modifiers.includes('h'));
            const fearRoll = this.dice.find(x => x.modifiers.includes('f'));
            if (hopeRoll && fearRoll) {
                const diceSoNice = 
                    game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.appearance).diceSoNiceData;
                const isCritical = hopeRoll.total === fearRoll.total;
                hopeRoll.options.sfx = getDiceSoNiceSFX({ 
                    critical: isCritical, 
                    higher: hopeRoll.total > fearRoll.total,
                    data: diceSoNice.hope.sfx
                });
                fearRoll.options.sfx = getDiceSoNiceSFX({ 
                    critical: isCritical, 
                    higher: fearRoll.total > hopeRoll.total,
                    data: diceSoNice.fear.sfx
                });
            }
        }

        return this;
    }
}
