import BaseDie from './baseDie.mjs';

export default class AdvantageDie extends BaseDie {
    constructor(options) {
        super(options);

        this.modifiers = [];
    }
}
