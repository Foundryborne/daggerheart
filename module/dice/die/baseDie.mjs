import { adjustDice } from '../../helpers/utils.mjs';

export default class BaseDie extends foundry.dice.terms.Die {
    static MODIFIERS = {
        ...foundry.dice.terms.Die.MODIFIERS,
        cc: 'compoundComboDice',
        c: 'comboDice'
    };

    async compoundComboDice() {
        return this.handleComboDice(true);
    }

    async comboDice() {
        return this.handleComboDice(false);
    }

    async handleComboDice(maxIncreasesDiceSize) {
        /* ComboDice only works with exactly two dice and both have to be the same denomination */
        if (this.number !== 2) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.comboDiceOnlyTwoDiceError'));
            return false;
        }

        const result = await this.continueCombo(maxIncreasesDiceSize);

        /* The flow of DiceSoNice has no way of knowign that some of the results of a Die should be a different denomination 
           We solve this by marking the results as hidden so they're not picked up by the auto roll of DiceSoNice.
           The actual rolls are done here in place so every dice gets the correct denomination.
        */
        if (game.modules.get('dice-so-nice')?.active) {
            const rolls = [];
            for (const result of this.results) {
                const roll = await (new Roll(`1${result.denomination ?? this.denomination}`)).evaluate();
                roll.terms[0].results = [result];
                roll._evaluateTotal();
                rolls.push(roll);
            }

            /* If there are other dice that will be rolled we cannot await here. The other dice will be awaited in the normal flow */
            if (this._root.dice.length > 1) {
                for (const roll of rolls) {
                    game.dice3d.showForRoll(roll, game.user, true);
                }
            } else {
                await Promise.allSettled(rolls.map(roll => game.dice3d.showForRoll(roll, game.user, true)));
            }
        }

        for (const result of this.results)
            result.hidden = true;

        return result;
    }

    async continueCombo(maxIncreasesDiceSize) {
        const lastIndex = this.results.length - 1;

        /* The Combo only continues if the latest roll was higher or equal to the previous */
        if (this.results[lastIndex].result < this.results[lastIndex - 1].result) return false;

        const lastFaces = this.results[lastIndex].denomination?.slice(1) ?? this.faces;
        const increaseDiceSize = maxIncreasesDiceSize && lastFaces < 12 && this.results[lastIndex].result === lastFaces;
        const denomination = increaseDiceSize ? adjustDice(this.denomination, false) : this.denomination;

        const newRoll = await (new Roll(`1${denomination}`)).evaluate();
        this.results.push({ result: newRoll.total, denomination: denomination, active: true });
        this.number += 1;

        return this.continueCombo(maxIncreasesDiceSize);
    }

    /** @override */
    getResultCSS(result) {
        const hasSuccess = result.success !== undefined;
        const hasFailure = result.failure !== undefined;
        const isMax = result.result === this.faces;
        const isMin = result.result === 1;
        return [
            this.constructor.name.toLowerCase(),
            result.denomination ?? this.denomination, // Accomodating ComboDie as a result can have a different denomination than the die as a whole
            result.success ? 'success' : null,
            result.failure ? 'failure' : null,
            result.rerolled ? 'rerolled' : null,
            result.exploded ? 'exploded' : null,
            result.discarded ? 'discarded' : null,
            !(hasSuccess || hasFailure) && isMin ? 'min' : null,
            !(hasSuccess || hasFailure) && isMax ? 'max' : null
        ];
    }
}