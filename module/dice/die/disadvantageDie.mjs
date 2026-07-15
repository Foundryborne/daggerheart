import BaseDie from './baseDie.mjs';

export default class DisadvantageDie extends BaseDie {
    constructor(options) {
        super(options);

        this.modifiers = [];
    }
}
