import D20RollDialog from '../applications/dialogs/d20RollDialog.mjs';
import D20Roll from './d20Roll.mjs';
import { setDiceSoNiceForDualityRoll } from '../helpers/utils.mjs';

export default class DualityRoll extends D20Roll {
    _advantageFaces = 6;

    constructor(formula, data = {}, options = {}) {
        super(formula, data, options);
    }

    static messageType = 'dualityRoll';

    static DefaultDialog = D20RollDialog;

    get dHope() {
        // if ( !(this.terms[0] instanceof foundry.dice.terms.Die) ) return;
        if (!(this.dice[0] instanceof CONFIG.Dice.daggerheart.DualityDie)) this.createBaseDice();
        return this.dice[0];
        // return this.#hopeDice;
    }

    set dHope(faces) {
        if (!(this.dice[0] instanceof CONFIG.Dice.daggerheart.DualityDie)) this.createBaseDice();
        this.terms[0].faces = this.getFaces(faces);
        // this.#hopeDice = `d${face}`;
    }

    get dFear() {
        // if ( !(this.terms[1] instanceof foundry.dice.terms.Die) ) return;
        if (!(this.dice[1] instanceof CONFIG.Dice.daggerheart.DualityDie)) this.createBaseDice();
        return this.dice[1];
        // return this.#fearDice;
    }

    set dFear(faces) {
        if (!(this.dice[1] instanceof CONFIG.Dice.daggerheart.DualityDie)) this.createBaseDice();
        this.dice[1].faces = this.getFaces(faces);
        // this.#fearDice = `d${face}`;
    }

    get dAdvantage() {
        return this.dice[2];
    }

    get advantageFaces() {
        return this._advantageFaces;
    }

    set advantageFaces(faces) {
        this._advantageFaces = this.getFaces(faces);
    }

    get isCritical() {
        if (!this.dHope._evaluated || !this.dFear._evaluated) return;
        return this.dHope.total === this.dFear.total;
    }

    get withHope() {
        if (!this._evaluated) return;
        return this.dHope.total > this.dFear.total;
    }

    get withFear() {
        if (!this._evaluated) return;
        return this.dHope.total < this.dFear.total;
    }

    get hasBarRally() {
        return null;
    }

    get totalLabel() {
        const label = this.withHope
            ? 'DAGGERHEART.GENERAL.hope'
            : this.withFear
              ? 'DAGGERHEART.GENERAL.fear'
              : 'DAGGERHEART.GENERAL.criticalSuccess';

        return game.i18n.localize(label);
    }

    static getHooks(hooks) {
        return [...(hooks ?? []), 'Duality'];
    }

    createBaseDice() {
        if (
            this.dice[0] instanceof CONFIG.Dice.daggerheart.DualityDie &&
            this.dice[1] instanceof CONFIG.Dice.daggerheart.DualityDie
        ) {
            this.terms = [this.terms[0], this.terms[1], this.terms[2]];
            return;
        }
        this.terms[0] = new CONFIG.Dice.daggerheart.DualityDie();
        this.terms[1] = new foundry.dice.terms.OperatorTerm({ operator: '+' });
        this.terms[2] = new CONFIG.Dice.daggerheart.DualityDie();
    }

    applyAdvantage() {
        const dieFaces = this.advantageFaces,
            bardRallyFaces = this.hasBarRally,
            advDie = new foundry.dice.terms.Die({ faces: dieFaces });
        if (this.hasAdvantage || this.hasDisadvantage || bardRallyFaces)
            this.terms.push(new foundry.dice.terms.OperatorTerm({ operator: this.hasDisadvantage ? '-' : '+' }));
        if (bardRallyFaces) {
            const rallyDie = new foundry.dice.terms.Die({ faces: bardRallyFaces });
            if (this.hasAdvantage) {
                this.terms.push(
                    new foundry.dice.terms.PoolTerm({
                        terms: [advDie.formula, rallyDie.formula],
                        modifiers: ['kh']
                    })
                );
            } else if (this.hasDisadvantage) {
                this.terms.push(advDie, new foundry.dice.terms.OperatorTerm({ operator: '+' }), rallyDie);
            }
        } else if (this.hasAdvantage || this.hasDisadvantage) this.terms.push(advDie);
    }

    applyBaseBonus() {
        this.options.roll.modifiers = [];
        if (!this.options.roll.trait) return;
        this.options.roll.modifiers.push({
            label: `DAGGERHEART.CONFIG.Traits.${this.options.roll.trait}.name`,
            value: Roll.replaceFormulaData(`@traits.${this.options.roll.trait}.value`, this.data)
        });
    }

    static postEvaluate(roll, config = {}) {
        super.postEvaluate(roll, config);
        config.roll.hope = {
            dice: roll.dHope.denomination,
            value: roll.dHope.total
        };
        config.roll.fear = {
            dice: roll.dFear.denomination,
            value: roll.dFear.total
        };
        config.roll.result = {
            duality: roll.withHope ? 1 : roll.withFear ? -1 : 0,
            total: roll.dHope.total + roll.dFear.total,
            label: roll.totalLabel
        };

        setDiceSoNiceForDualityRoll(roll, config.roll.advantage.type);
    }
}
