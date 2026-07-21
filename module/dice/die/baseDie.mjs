export default class BaseDie extends foundry.dice.terms.Die {
    async rerollResult(resultIndex) {
        const result = this.results[resultIndex];
        result.rerolled = true;
        result.active = false;
        await this.roll({ reroll: true });

        const rerolledResult = this.results[this.results.length - 1];
        this.results.splice(this.results.length - 1, 1);
        this.results.splice(resultIndex, 0, rerolledResult);
    }
}