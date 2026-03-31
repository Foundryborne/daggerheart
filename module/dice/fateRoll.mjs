import D20RollDialog from '../applications/dialogs/d20RollDialog.mjs';
import D20Roll from './d20Roll.mjs';
import { setDiceSoNiceForHopeFateRoll, setDiceSoNiceForFearFateRoll } from '../helpers/utils.mjs';

export default class FateRoll extends D20Roll {
    constructor(formula, data = {}, options = {}) {
        super(formula, data, options);
    }

    static messageType = 'fateRoll';

    static DefaultDialog = D20RollDialog;

    get title() {
        return game.i18n.localize(`DAGGERHEART.GENERAL.fateRoll`);
    }

    get dHope() {
        if (!(this.dice[0] instanceof foundry.dice.terms.Die)) this.createBaseDice();
        return this.dice[0];
    }

    set dHope(faces) {
        // TODO this should not be asymmetrical with the getter. updateRollConfiguration() should use dHope.faces
        this.dHope.faces = this.getFaces(faces);
    }

    get dFear() {
        if (!(this.dice[0] instanceof foundry.dice.terms.Die)) this.createBaseDice();
        return this.dice[0];
    }

    set dFear(faces) {
        // TODO this should not be asymmetrical with the getter. updateRollConfiguration() should use dFear.faces
        this.dFear.faces = this.getFaces(faces);
    }

    get isCritical() {
        return false;
    }

    get fateDie() {
        return this.data.fateType;
    }

    get withHope() {
        if (!this._evaluatedl) return;
        return this.dHope.total >= this.dFear.total;
    }

    get withFear() {
        if (!this._evaluated) return;
        return this.dHope.total < this.dFear.total;
    }

    get totalLabel() {
        const label = this.withHope ? 'DAGGERHEART.GENERAL.hope' : 'DAGGERHEART.GENERAL.fear';

        return game.i18n.localize(label);
    }

    static getHooks(hooks) {
        return [...(hooks ?? []), 'Fate'];
    }

    /** @inheritDoc */
    static fromData(data) {
        data.terms[0].class = foundry.dice.terms.Die.name;
        return super.fromData(data);
    }

    createBaseDice() {
        if (this.dice[0] instanceof foundry.dice.terms.Die) {
            this.terms = [this.terms[0]];
            return;
        }
        this.terms[0] = new foundry.dice.terms.Die({ faces: 12 });
    }

    static async buildEvaluate(roll, config = {}, message = {}) {
        await super.buildEvaluate(roll, config, message);

        if (roll.fateDie === 'Hope') {
            await setDiceSoNiceForHopeFateRoll(roll, config.roll.fate.dice);
        } else {
            await setDiceSoNiceForFearFateRoll(roll, config.roll.fate.dice);
        }
    }

    static postEvaluate(roll, config = {}) {
        const data = super.postEvaluate(roll, config);

        data.fate = {
            dice: roll.fateDie === 'Hope' ? roll.dHope.denomination : roll.dFear.denomination,
            value: roll.fateDie === 'Hope' ? roll.dHope.total : roll.dFear.total,
            fateDie: roll.fateDie
        };

        return data;
    }
}
