import D20RollDialog from '../applications/dialogs/d20RollDialog.mjs';
import D20Roll from './d20Roll.mjs';
import { setDiceSoNiceForFateRoll } from '../helpers/utils.mjs';

export default class FateRoll extends D20Roll {
     constructor(formula, data = {}, options = {}) {
        super(formula, data, options);
    }

    static messageType = 'fateRoll';

    static DefaultDialog = D20RollDialog;

    get title() {
        return game.i18n.localize(
            `DAGGERHEART.GENERAL.fateRoll`
        );
    }

    get dHope() {
        // if ( !(this.terms[0] instanceof foundry.dice.terms.Die) ) return;
        if (!(this.dice[0] instanceof foundry.dice.terms.Die)) this.createBaseDice();
        return this.dice[0];
        // return this.#hopeDice;
    }

    set dHope(faces) {
        if (!(this.dice[0] instanceof foundry.dice.terms.Die)) this.createBaseDice();
        this.terms[0].faces = this.getFaces(faces);
        // this.#hopeDice = `d${face}`;
    }

    get isCritical() {
        return false;
    }


    get fateDie() {
        return "Hope";
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

        await setDiceSoNiceForFateRoll(
            roll,
            config.roll.hope.dice
        );
    }

    static postEvaluate(roll, config = {}) {
        const data = super.postEvaluate(roll, config);

        data.hope = {
            dice: roll.dHope.denomination,
            value: roll.dHope.total,
        };

        return data;
    }

}
