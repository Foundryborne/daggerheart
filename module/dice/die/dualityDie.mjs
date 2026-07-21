import BaseDie from './baseDie.mjs';
import { updateResourcesForDualityReroll } from '../helpers.mjs';

export default class DualityDie extends BaseDie {
    constructor(options) {
        super(options);

        this.modifiers = [];
    }

    #getDualityState(roll) {
        if (!roll) return null;
        return roll.withHope ? 1 : roll.withFear ? -1 : 0;
    }

    async reroll(modifier, options) {
        const oldDuality = this.#getDualityState(options.liveRoll.roll);
        await super.reroll(modifier, options);

        if (options?.liveRoll) {
            /* Can't currently test since DiceSoNice is not v14. Might need to set the appearance earlier if a roll is triggered by super.reroll */
            if (game.modules.get('dice-so-nice')?.active) {
                const diceSoNiceRoll = {
                    _evaluated: true,
                    dice: [this],
                    options: { appearance: {} }
                };

                const diceAppearance = await this.getDiceSoNiceAppearance(options.liveRoll.roll);
                diceSoNiceRoll.dice[0].options.appearance = diceAppearance.appearance;
                diceSoNiceRoll.dice[0].options.modelFile = diceAppearance.modelFile;
                diceSoNiceRoll.dice[0].results = diceSoNiceRoll.dice[0].results.filter(x => x.active);

                await game.dice3d.showForRoll(diceSoNiceRoll, game.user, true);
            } else {
                foundry.audio.AudioHelper.play({ src: CONFIG.sounds.dice });
            }

            await options.liveRoll.roll._evaluate();
            if (options.liveRoll.isReaction) return;

            const newDuality = this.#getDualityState(options.liveRoll.roll);
            updateResourcesForDualityReroll(oldDuality, newDuality, options.liveRoll.actor);
        }
    }

    /**
     * Overridden by extending classes HopeDie and FearDie
     */
    async getDiceSoNiceAppearance() {
        return {};
    }
}
