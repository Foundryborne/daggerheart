import D20RollDialog from '../applications/dialogs/d20RollDialog.mjs';
import D20Roll from './d20Roll.mjs';
import { setDiceSoNiceForDualityRoll } from '../helpers/utils.mjs';
import { getDiceSoNicePresets } from '../config/generalConfig.mjs';

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

    get title() {
        return game.i18n.localize(
            "DAGGERHEART.GENERAL.dualityRoll"
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

    get dFear() {
        // if ( !(this.terms[1] instanceof foundry.dice.terms.Die) ) return;
        if (!(this.dice[1] instanceof foundry.dice.terms.Die)) this.createBaseDice();
        return this.dice[1];
        // return this.#fearDice;
    }

    set dFear(faces) {
        if (!(this.dice[1] instanceof foundry.dice.terms.Die)) this.createBaseDice();
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
        return this.data?.parent?.appliedEffects.reduce((a, c) => {
            const change = c.changes.find(ch => ch.key === 'system.bonuses.rally');
            if (change) a.push({ value: c.id, label: change.value });
            return a;
        }, []);
    }

    get dRally() {
        if (!this.rallyFaces) return null;
        if (this.hasDisadvantage || this.hasAdvantage) return this.dice[3];
        else return this.dice[2];
    }

    get rallyFaces() {
        const rallyChoice = this.rallyChoices?.find(r => r.value === this._rallyIndex)?.label;
        return rallyChoice ? this.getFaces(rallyChoice) : null;
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

    /** @inheritDoc */
    static fromData(data) {
        data.terms[0].class = foundry.dice.terms.Die.name;
        data.terms[2].class = foundry.dice.terms.Die.name;
        return super.fromData(data);
    }

    createBaseDice() {
        if (
            this.dice[0] instanceof foundry.dice.terms.Die &&
            this.dice[1] instanceof foundry.dice.terms.Die
        ) {
            this.terms = [this.terms[0], this.terms[1], this.terms[2]];
            return;
        }
        this.terms[0] = new foundry.dice.terms.Die({ faces: 12 });
        this.terms[1] = new foundry.dice.terms.OperatorTerm({ operator: '+' });
        this.terms[2] = new foundry.dice.terms.Die({ faces: 12 });
    }

    applyAdvantage() {
        if (this.hasAdvantage || this.hasDisadvantage) {
            const dieFaces = this.advantageFaces,
                advDie = new foundry.dice.terms.Die({ faces: dieFaces, number: this.advantageNumber });
            if (this.advantageNumber > 1) advDie.modifiers = ['kh'];
            this.terms.push(
                new foundry.dice.terms.OperatorTerm({ operator: this.hasDisadvantage ? '-' : '+' }),
                advDie
            );
        }
        if (this.rallyFaces)
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

    static async buildEvaluate(roll, config = {}, message = {}) {
        await super.buildEvaluate(roll, config, message);

        await setDiceSoNiceForDualityRoll(
            roll,
            config.roll.advantage.type,
            config.roll.hope.dice,
            config.roll.fear.dice,
            config.roll.advantage.dice
        );
    }

    static postEvaluate(roll, config = {}) {
        const data = super.postEvaluate(roll, config);

        data.hope = {
            dice: roll.dHope.denomination,
            value: roll.dHope.total,
            rerolled: {
                any: roll.dHope.results.some(x => x.rerolled),
                rerolls: roll.dHope.results.filter(x => x.rerolled)
            }
        };
        data.fear = {
            dice: roll.dFear.denomination,
            value: roll.dFear.total,
            rerolled: {
                any: roll.dFear.results.some(x => x.rerolled),
                rerolls: roll.dFear.results.filter(x => x.rerolled)
            }
        };
        data.rally = {
            dice: roll.dRally?.denomination,
            value: roll.dRally?.total
        };
        data.result = {
            duality: roll.withHope ? 1 : roll.withFear ? -1 : 0,
            total: roll.dHope.total + roll.dFear.total,
            label: roll.totalLabel
        };

        if (roll._rallyIndex && roll.data?.parent)
            roll.data.parent.deleteEmbeddedDocuments('ActiveEffect', [roll._rallyIndex]);

        return data;
    }

    static async reroll(rollString, target, message) {
        let parsedRoll = game.system.api.dice.DualityRoll.fromData({ ...rollString, evaluated: false });
        const term = parsedRoll.terms[target.dataset.dieIndex];
        await term.reroll(`/r1=${term.total}`);
        if (game.modules.get('dice-so-nice')?.active) {
            const diceSoNiceRoll = {
                _evaluated: true,
                dice: [
                    new foundry.dice.terms.Die({
                        ...term,
                        faces: term._faces,
                        results: term.results.filter(x => !x.rerolled)
                    })
                ],
                options: { appearance: {} }
            };

            const diceSoNicePresets = await getDiceSoNicePresets(`d${term._faces}`, `d${term._faces}`);
            const type = target.dataset.type;
            if (diceSoNicePresets[type]) {
                diceSoNiceRoll.dice[0].options = diceSoNicePresets[type];
            }

            await game.dice3d.showForRoll(diceSoNiceRoll, game.user, true);
        }

        await parsedRoll.evaluate();

        const newRoll = game.system.api.dice.DualityRoll.postEvaluate(parsedRoll, {
            targets: message.system.targets,
            roll: {
                advantage: message.system.roll.advantage?.type,
                difficulty: message.system.roll.difficulty ? Number(message.system.roll.difficulty) : null
            }
        });
        newRoll.extra = newRoll.extra.slice(2);

        Hooks.call(`${CONFIG.DH.id}.postRollDuality`, {
            source: { actor: message.system.source.actor ?? '' },
            targets: message.system.targets,
            roll: newRoll,
            rerolledRoll:
                newRoll.result.duality !== message.system.roll.result.duality ? message.system.roll : undefined
        });
        return { newRoll, parsedRoll };
    }
}
