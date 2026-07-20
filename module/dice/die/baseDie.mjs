import { adjustDice, triggerChatRollFx } from '../../helpers/utils.mjs';

export default class BaseDie extends foundry.dice.terms.Die {
    static MODIFIERS = {
        ...foundry.dice.terms.Die.MODIFIERS,
        cc: 'compoundComboDice',
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
            await this.handleComboDiceReroll(resultIndex);
        } 
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

    /* -------------------------------------------- */
    /*  Modifier Logic                              */
    /* -------------------------------------------- */

    async compoundComboDice() {
        return this.handleComboDice({ maxIncreasesDiceSize: true});
    }

    async comboDice() {
        return this.handleComboDice({ maxIncreasesDiceSize: false });
    }

    async handleComboDice(maxIncreasesDiceSize) {
        /* ComboDice only works with exactly two dice and both have to be the same denomination */
        if (this.number !== 2) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.comboDiceOnlyTwoDiceError'));
            return false;
        }

        return this.rollComboDice(maxIncreasesDiceSize);
    }

    async rollComboDice(options) {
        const { maxIncreasesDiceSize, rerollStartIndex } = options;
        const initialResultsLength = this.results.length;
        const result = await this.continueCombo(maxIncreasesDiceSize);

        /* The flow of DiceSoNice has no way of knowing that some of the results of a Die should be a different denomination 
           We solve this by marking the results as hidden so they're not picked up by the auto roll of DiceSoNice.
           The actual rolls are done here in place so every dice gets the correct denomination.
        */
        if (game.modules.get('dice-so-nice')?.active) {
            const resultsToRoll = this.results.filter((x, index) => { 
                if (!x.active) return false;
                if (rerollStartIndex) 
                    return index === rerollStartIndex || index > initialResultsLength - 1;

                return true;
            });
            const rolls = [];
            for (const result of resultsToRoll) {
                const roll = await (new Roll(`1${result.denomination ?? this.denomination}`)).evaluate();
                roll.terms[0].results = [result];
                roll._evaluateTotal();
                rolls.push(roll);
            }

            /* If there are other dice that will be rolled we cannot await here. The other dice will be awaited in the normal flow */
            if (rerollStartIndex === undefined && this._root.dice.length > 1) {
                for (const roll of rolls) {
                    game.dice3d.showForRoll(roll, game.user, true);
                }
            } else {
                await Promise.allSettled(rolls.map(roll => game.dice3d.showForRoll(roll, game.user, true)));
            }
        }

        for (const result of this.results)
            result.hidden = true;

        const modifier = maxIncreasesDiceSize ? 'cc' : 'c';
        if (!this.modifiers.includes(modifier))
            this.modifiers.push(modifier);

        return result;
    }

    async continueCombo(maxIncreasesDiceSize) {
        const activeResults = this.results.filter(x => x.active);
        const lastIndex = activeResults.length - 1;

        /* The Combo only continues if the latest roll was higher or equal to the previous */
        if (activeResults[lastIndex].result < activeResults[lastIndex - 1].result) return false;

        const lastFaces = activeResults[lastIndex].denomination?.slice(1) ?? this.faces;
        const increaseDiceSize = 
            maxIncreasesDiceSize && lastFaces < 12 && 
            activeResults[lastIndex].result === lastFaces;
        const denomination = increaseDiceSize ? adjustDice(this.denomination, false) : this.denomination;

        const newRoll = await (new Roll(`1${denomination}`)).evaluate();
        this.results.push({ result: newRoll.total, denomination: denomination, active: true });
        this.number += 1;

        return this.continueCombo(maxIncreasesDiceSize);
    }

    async handleComboDiceReroll(rerolledIndex) {
        const resultGroupingIndexes = this.results.map((x, index) => ({ index, active: x.active }))
            .filter(x => x.active).map(x => x.index);
        if (resultGroupingIndexes.length <= 1) return;

        const rerolledResult = this.results[rerolledIndex];
        const compoundCombo = this.modifiers.includes('cc');
        const rerollGroupingIndex = resultGroupingIndexes.indexOf(rerolledIndex);

        const previousIndex = resultGroupingIndexes[rerollGroupingIndex - 1];
        const previousResult = this.results[previousIndex];
        const nextIndex = resultGroupingIndexes[rerollGroupingIndex + 1];
        const nextResult = this.results[nextIndex];

        /* Rerolling any of the last two dice might introduce new results */
        if (
            rerollGroupingIndex === resultGroupingIndexes.length - 1 &&
            rerolledResult.result >= previousResult?.result
        ) {
            return await this.rollComboDice({ 
                maxIncreasesDiceSize: compoundCombo, 
                rerollStartIndex: rerollGroupingIndex 
            });
        } else if (
            rerollGroupingIndex === resultGroupingIndexes.length - 2 &&
            rerolledResult.result < nextResult?.result
        ) {
            return await this.rollComboDice({ 
                maxIncreasesDiceSize: compoundCombo, 
                rerollStartIndex: rerollGroupingIndex 
            });
        }
        /* Rerolling a preceeding dice might invalidate later dice which should then be dropped */
        else if (rerolledResult.result < previousResult?.result){
            const cutoffIndex = rerollGroupingIndex === 0 ? resultGroupingIndexes[1] + 1 : rerolledIndex + 1;
            this.results = this.results.slice(0, cutoffIndex);
            this.number = this.results.filter(x => x.active).length;
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