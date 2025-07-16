import D20RollDialog from '../applications/dialogs/d20RollDialog.mjs';
import D20Roll from './d20Roll.mjs';
import { setDiceSoNiceForDualityRoll } from '../helpers/utils.mjs';

export default class DualityRoll extends D20Roll {
    _advantageFaces = 6;
    _advantageNumber = 1;
    _rallyIndex;

    constructor(formula, data = {}, options = {}) {
        super(formula, data, options);
        this.rallyChoices = this.setRallyChoices();
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

    get advantageNumber() {
        return this._advantageNumber;
    }

    set advantageNumber(value) {
        this._advantageNumber = Number(value);
    }

    setRallyChoices() {
        return this.data?.parent?.effects.reduce((a,c) => {
                const change = c.changes.find(ch => ch.key === 'system.bonuses.rally');
                if(change) a.push({ value: c.id, label: change.value });
                return a;
            }, []);
    }

    get dRally() {
        if(!this.rallyFaces) return null;
        if(this.hasDisadvantage || this.hasAdvantage)
            return this.dice[3];
        else
            return this.dice[2];
    }

    get rallyFaces() {
        const rallyChoice = this.rallyChoices?.find(r => r.value === this._rallyIndex)?.label;
        return rallyChoice ? this.getFaces(rallyChoice) :  null;
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
        if (this.hasAdvantage || this.hasDisadvantage) {
            const dieFaces = this.advantageFaces,
                advDie = new foundry.dice.terms.Die({ faces: dieFaces, number: this.advantageNumber });
            if(this.advantageNumber > 1) advDie.modifiers = ['kh'];
            this.terms.push(
                new foundry.dice.terms.OperatorTerm({ operator: this.hasDisadvantage ? '-' : '+' }),
                advDie
            );
        }
        if(this.rallyFaces)
            this.terms.push(
                new foundry.dice.terms.OperatorTerm({ operator: this.hasDisadvantage ? '-' : '+' }),
                new foundry.dice.terms.Die({ faces: this.rallyFaces })
            );
    }

    applyBaseBonus() {
        const modifiers = super.applyBaseBonus();

        if (this.options.roll.trait && this.data.traits[this.options.roll.trait])
            modifiers.unshift({
                label: `DAGGERHEART.CONFIG.Traits.${this.options.roll.trait}.name`,
                value: this.data.traits[this.options.roll.trait].value
            });

        const weapons = ['primaryWeapon', 'secondaryWeapon'];
        weapons.forEach(w => {
            if (this.options.source.item && this.options.source.item === this.data[w]?.id)
                modifiers.push(...this.getBonus(`roll.${w}`, 'Weapon Bonus'));
        });

        return modifiers;
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
        config.roll.rally = {
            dice: roll.dRally?.denomination,
            value: roll.dRally?.total
        };
        config.roll.result = {
            duality: roll.withHope ? 1 : roll.withFear ? -1 : 0,
            total: roll.dHope.total + roll.dFear.total,
            label: roll.totalLabel
        };

        if(roll._rallyIndex && roll.data?.parent) 
            roll.data.parent.deleteEmbeddedDocuments('ActiveEffect', [roll._rallyIndex]);

        setDiceSoNiceForDualityRoll(roll, config.roll.advantage.type);
    }
}
