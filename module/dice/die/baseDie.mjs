import { adjustDice } from '../../helpers/utils.mjs';

export default class BaseDie extends foundry.dice.terms.Die {
    static MODIFIERS = {
        ...foundry.dice.terms.Die.MODIFIERS,
        c: 'comboDice'
    };

    async comboDice(modifier) {
        /* ComboDice only works with exactly two dice and both have to be the same denomination */
        if (this.number !== 2) return false;

        const maxIncreasesDiceSize = modifier.endsWith('1');
        return this.continueCombo(maxIncreasesDiceSize);
    }

    async continueCombo(maxIncreasesDiceSize) {
        const lastIndex = this.results.length - 1;

        /* The Combo only continues if the latest roll was higher than the previous */
        if (this.results[lastIndex].result <= this.results[lastIndex - 1].result) return false;

        const increaseDiceSize = maxIncreasesDiceSize && this.results[lastIndex].result === this.faces;
        const denomination = increaseDiceSize ? adjustDice(this.denomination, false) : this.denomination;
        const newRoll = await (new Roll(`1${denomination}`)).evaluate();
        this.results.push({ result: newRoll.total, active: true });
        this.number += 1;

        return this.continueCombo();
    }
}