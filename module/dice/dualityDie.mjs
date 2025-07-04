export default class DualityDie extends foundry.dice.terms.Die {
    constructor({ number = 1, faces = 12, ...args } = {}) {
        super({ number, faces, ...args });
    }
}
