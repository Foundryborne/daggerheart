import { ResourceUpdateMap } from '../../data/action/baseAction.mjs';

export default class DualityDie extends foundry.dice.terms.Die {
    constructor(options) {
        super(options);

        this.modifiers = [];
    }

    #getDualityState(roll) {
        if (!roll) return null;
        return roll.withHope ? 1 : roll.withFear ? -1 : 0;
    }

    #updateResources(oldDuality, newDuality, actor) {
        const { hopeFear } = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation);
        if (game.user.isGM ? !hopeFear.gm : !hopeFear.players) return;

        const updates = [];
        const hope = (newDuality >= 0 ? 1 : 0) - (oldDuality >= 0 ? 1 : 0);
        const stress = (newDuality === 0 ? 1 : 0) - (oldDuality === 0 ? 1 : 0);
        const fear = (newDuality === -1 ? 1 : 0) - (oldDuality === -1 ? 1 : 0);

        if (hope !== 0) updates.push({ key: 'hope', value: hope, total: -1 * hope, enabled: true });
        if (stress !== 0) updates.push({ key: 'stress', value: -1 * stress, total: stress, enabled: true });
        if (fear !== 0) updates.push({ key: 'fear', value: fear, total: -1 * fear, enabled: true });

        const resourceUpdates = new ResourceUpdateMap(actor);
        resourceUpdates.addResources(updates);
        resourceUpdates.updateResources();
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

                const preset = await getDiceSoNicePreset(diceSoNice[key], faces);
                diceSoNiceRoll.dice[0].options.appearance = preset.appearance;
                diceSoNiceRoll.dice[0].options.modelFile = preset.modelFile;

                await game.dice3d.showForRoll(diceSoNiceRoll, game.user, true);
            } else {
                foundry.audio.AudioHelper.play({ src: CONFIG.sounds.dice });
            }

            await options.liveRoll.roll._evaluate();
            if (options.liveRoll.isReaction) return;

            const newDuality = this.#getDualityState(options.liveRoll.roll);
            this.#updateResources(oldDuality, newDuality, options.liveRoll.actor);
        }
    }
}
