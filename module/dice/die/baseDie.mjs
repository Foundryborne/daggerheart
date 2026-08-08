import { triggerChatRollFx } from '../../helpers/utils.mjs';

export default class BaseDie extends foundry.dice.terms.Die {
    static MODIFIERS = {
        ...foundry.dice.terms.Die.MODIFIERS,
        c: 'comboDice'
    };

    async rerollResult(resultToReroll) {
        const resultIndex = Number(resultToReroll);
        const result = this.results[resultIndex];
        result.rerolled = true;
        result.active = false;
        await this.roll({ reroll: true });

        const rerolledResult = this.results[this.results.length - 1];
        this.results.splice(this.results.length - 1, 1);
        this.results.splice(resultIndex, 0, rerolledResult);

        if (['c', 'cc'].some(x => this.modifiers.includes(x))) {
            await this.handleComboDiceReroll(resultIndex, result);
        }

        rerolledResult.rerolled = true;
        return rerolledResult;
    }

    /** @inheritDoc */
    getResultCSS(result) {
        // Accomodating ComboDie as a result can have a different denomination than the die as a whole
        const css = super.getResultCSS(result);
        const idx = css.findIndex(c => /d\d+/.test(c));
        css[idx] = result.denomination ?? this.denomination;
        return css;
    }

    /* -------------------------------------------- */
    /*  Modifier Logic                              */
    /* -------------------------------------------- */

    async comboDice() {
        /* ComboDice only works with exactly two dice and both have to be the same denomination */
        if (this.number !== 2) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.comboDiceOnlyTwoDiceError'));
            return false;
        }

        return this.rollComboDice();
    }

    async rollComboDice(options = {}) {
        const { rerollStartIndex } = options;
        const initialResultsLength = this.results.filter(x => x.active).length;
        const result = await this.continueCombo();

        /* The flow of DiceSoNice has no way of knowing that some of the results of a Die should be a different denomination 
           We solve this by marking the results as hidden so they're not picked up by the auto roll of DiceSoNice.
           The actual rolls are done here in place so every dice gets the correct denomination.
        */
        if (game.dice3d) {
            const resultsToRoll = this.results.filter((x, index) => 
                x.active && (!rerollStartIndex || index === rerollStartIndex || index > initialResultsLength - 1));
            const rolls = [];
            for (const result of resultsToRoll) {
                const roll = await (new Roll(`1${result.denomination ?? this.denomination}`)).evaluate();
                roll.terms[0].results = [result];
                roll._evaluateTotal();
                rolls.push(roll);
            }

            /* If there are other dice that will be rolled we cannot await here. The other dice will be awaited in the normal flow */
            const promises = rolls.map(roll => game.dice3d.showForRoll(roll, game.user, true));
            if (rerollStartIndex !== undefined || this._root.dice.length <= 1) {
                await Promise.allSettled(promises);
            }
        }

        for (const result of this.results)
            result.hidden = true;

        if (!this.modifiers.includes('c'))
            this.modifiers.push('c');

        return result;
    }

    async continueCombo() {
        const activeResults = this.results.filter(x => x.active);
        const lastIndex = activeResults.length - 1;
        const lastResult = activeResults[lastIndex];

        /* The Combo only continues if the latest roll was higher or equal to the previous */
        if (lastResult.result < activeResults[lastIndex - 1].result) return false;

        const lastFaces = lastResult.denomination ? 
            Number(lastResult.denomination.slice(1)) : this.faces;
        const currentDenomination = `d${lastFaces}`

        const newRoll = await (new Roll(`1${currentDenomination}`)).evaluate();
        this.results.push({ result: newRoll.total, denomination: currentDenomination, active: true });
        this.number += 1;

        return this.continueCombo();
    }

    async handleComboDiceReroll(rerolledIndex) {
        const resultGroupingIndexes = this.results.map((x, index) => ({ index, active: x.active }))
            .filter(x => x.active).map(x => x.index);
        if (resultGroupingIndexes.length <= 1) return;

        const rerolledResult = this.results[rerolledIndex];
        const rerollGroupingIndex = resultGroupingIndexes.indexOf(rerolledIndex);

        const previousIndex = resultGroupingIndexes[rerollGroupingIndex - 1];
        const previousResult = this.results[previousIndex];
        const nextIndex = resultGroupingIndexes[rerollGroupingIndex + 1];
        const nextResult = this.results[nextIndex];

        const dropDice = preceeding => {
            const cutoffIndex = preceeding ? resultGroupingIndexes[rerollGroupingIndex + 1] + 1 : rerolledIndex + 1;
            this.results = this.results.slice(0, cutoffIndex);
            this.number = this.results.filter(x => x.active).length;
        };

        /* (1) Rerolling any of the last two dice might introduce new results */
        const isFinalHigher = 
            rerollGroupingIndex === resultGroupingIndexes.length - 1 && rerolledResult.result >= previousResult?.result;
        const isSemifinalLower = 
            rerollGroupingIndex === resultGroupingIndexes.length - 2 && rerolledResult.result < nextResult?.result;
        if (isFinalHigher || isSemifinalLower) {
            return await this.rollComboDice({
                rerollStartIndex: rerollGroupingIndex
            });
        }
        /* (2) Rerolling a subsequent dice might invalidate later dice which should then be dropped */
        else if (rerolledResult.result < previousResult?.result){
            dropDice(false);
        }
        /* (3) Rerolling a preceeding dice might invalidate later dice which should then be dropped */
        else if (rerolledResult.result >= nextResult?.result) {
            dropDice(true);
        }

        const fakeRollFaces = 
            rerolledResult.denomination ? rerolledResult.denomination.slice(1) : this.faces;
        const fakeRoll = {
            _evaluated: true,
            dice: [new foundry.dice.terms.Die({
                ...this,
                results: [rerolledResult],
                total: rerolledResult.result,
                faces: fakeRollFaces
            })],
            options: { appearance: {} }
        };
        await triggerChatRollFx([fakeRoll]);
        rerolledResult.hidden = true;
    }
}