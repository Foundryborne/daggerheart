import { updateResourcesForDualityReroll } from '../helpers.mjs';
import BaseDie from './baseDie.mjs';

export default class DualityDie extends BaseDie {
    get isRerolled() {
        return this.results.some(x => x.rerolled);
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
            if (game.dice3d) {
                const diceSoNiceRoll = {
                    _evaluated: true,
                    dice: [this]
                };

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
}
