import DHDamageRoll from '../data/chat-message/damageRoll.mjs';
import D20RollDialog from '../dialogs/d20RollDialog.mjs';
import DamageDialog from '../dialogs/damageDialog.mjs';
import { setDiceSoNiceForDualityRoll } from '../helpers/utils.mjs';

/*
    - Damage & other resources roll
    - Close dialog => don't roll
*/

export class DHRoll extends Roll {
    baseTerms = [];
    constructor(formula, data, options) {
        super(formula, data, options);
    }

    static messageType = 'adversaryRoll';

    static DefaultDialog = D20RollDialog;

    static async build(config = {}, message = {}) {
        const roll = await this.buildConfigure(config, message);
        if (!roll) return;
        await this.buildEvaluate(roll, config, (message = {}));
        await this.buildPost(roll, config, (message = {}));
        return config;
    }

    static async buildConfigure(config = {}, message = {}) {
        config.hooks = [...(config.hooks ?? []), ''];
        config.dialog ??= {};
        for (const hook of config.hooks) {
            if (Hooks.call(`${SYSTEM.id}.preRoll${hook.capitalize()}`, config, message) === false) return null;
        }

        this.applyKeybindings(config);

        let roll = new this(config.roll.formula, config.data, config);
        if (config.dialog.configure !== false) {
            // Open Roll Dialog
            const DialogClass = config.dialog?.class ?? this.DefaultDialog;
            console.log(roll, config);
            const configDialog = await DialogClass.configure(roll, config, message);
            if (!configDialog) return;
        }

        for (const hook of config.hooks) {
            if (Hooks.call(`${SYSTEM.id}.post${hook.capitalize()}RollConfiguration`, roll, config, message) === false)
                return [];
        }
        return roll;
    }

    static async buildEvaluate(roll, config = {}, message = {}) {
        if (config.evaluate !== false) await roll.evaluate();
        this.postEvaluate(roll, config);
    }

    static async buildPost(roll, config, message) {
        for (const hook of config.hooks) {
            if (Hooks.call(`${SYSTEM.id}.postRoll${hook.capitalize()}`, config, message) === false) return null;
        }

        // Create Chat Message
        if (config.source?.message) {
        } else {
            const messageData = {};
            config.message = await this.toMessage(roll, config);
        }
    }

    static postEvaluate(roll, config = {}) {
        if (!config.roll) config.roll = {};
        config.roll.total = roll.total;
        config.roll.formula = roll.formula;
        config.roll.dice = [];
        roll.dice.forEach(d => {
            config.roll.dice.push({
                dice: d.denomination,
                total: d.total,
                formula: d.formula,
                results: d.results
            });
        });
    }

    static async toMessage(roll, config) {
        const cls = getDocumentClass('ChatMessage'),
            msg = {
                type: this.messageType,
                user: game.user.id,
                sound: config.mute ? null : CONFIG.sounds.dice,
                system: config,
                rolls: [roll]
            };
        return await cls.create(msg);
    }

    static applyKeybindings(config) {
        if (config.event)
            config.dialog.configure ??= !(config.event.shiftKey || config.event.altKey || config.event.ctrlKey);
    }

    formatModifier(modifier) {
        const numTerm = modifier < 0 ? '-' : '+';
        return [
            new foundry.dice.terms.OperatorTerm({ operator: numTerm }),
            new foundry.dice.terms.NumericTerm({ number: Math.abs(modifier) })
        ];
    }

    getFaces(faces) {
        return Number(faces.startsWith('d') ? faces.replace('d', '') : faces);
    }

    constructFormula(config) {
        this.terms = Roll.parse(this.options.roll.formula, config.data);

        if (this.options.extraFormula) {
            this.terms.push(
                new foundry.dice.terms.OperatorTerm({ operator: '+' }),
                ...this.constructor.parse(this.options.extraFormula, this.options.data)
            );
        }
        return (this._formula = this.constructor.getFormula(this.terms));
    }
}

export class DualityDie extends foundry.dice.terms.Die {
    constructor({ number = 1, faces = 12, ...args } = {}) {
        super({ number, faces, ...args });
    }
}

export class D20Roll extends DHRoll {
    constructor(formula, data = {}, options = {}) {
        super(formula, data, options);
        this.constructFormula();
    }

    static ADV_MODE = {
        NORMAL: 0,
        ADVANTAGE: 1,
        DISADVANTAGE: -1
    };

    static messageType = 'adversaryRoll';

    static CRITICAL_TRESHOLD = 20;

    static DefaultDialog = D20RollDialog;

    get d20() {
        if (!(this.terms[0] instanceof foundry.dice.terms.Die)) this.createBaseDice();
        return this.terms[0];
    }

    set d20(faces) {
        if (!(this.terms[0] instanceof foundry.dice.terms.Die)) this.createBaseDice();
        this.terms[0].faces = this.getFaces(faces);
    }

    get dAdvantage() {
        return this.dice[2];
    }

    get isCritical() {
        if (!this.d20._evaluated) return;
        return this.d20.total >= this.constructor.CRITICAL_TRESHOLD;
    }

    get hasAdvantage() {
        return this.options.roll.advantage === this.constructor.ADV_MODE.ADVANTAGE;
    }

    get hasDisadvantage() {
        return this.options.roll.advantage === this.constructor.ADV_MODE.DISADVANTAGE;
    }

    static applyKeybindings(config) {
        let keys = {
            normal: true,
            advantage: false,
            disadvantage: false
        };

        if (config.event) {
            keys = {
                normal: config.event.shiftKey || config.event.altKey || config.event.ctrlKey,
                advantage: config.event.altKey,
                disadvantage: config.event.ctrlKey
            };
        }

        // Should the roll configuration dialog be displayed?
        config.dialog.configure ??= !Object.values(keys).some(k => k);

        // Determine advantage mode
        const advantage = config.roll.advantage === this.ADV_MODE.ADVANTAGE || keys.advantage || config.advantage;
        const disadvantage =
            config.roll.advantage === this.ADV_MODE.DISADVANTAGE || keys.disadvantage || config.disadvantage;
        if (advantage && !disadvantage) config.roll.advantage = this.ADV_MODE.ADVANTAGE;
        else if (!advantage && disadvantage) config.roll.advantage = this.ADV_MODE.DISADVANTAGE;
        else config.roll.advantage = this.ADV_MODE.NORMAL;
    }

    constructFormula(config) {
        // this.terms = [];
        this.createBaseDice();
        this.configureModifiers();
        this.resetFormula();
        return this._formula;
    }

    createBaseDice() {
        if (this.terms[0] instanceof foundry.dice.terms.Die) {
            this.terms = [this.terms[0]];
            return;
        }
        this.terms[0] = new foundry.dice.terms.Die({ faces: 20 });
    }

    configureModifiers() {
        this.applyAdvantage();
        this.applyBaseBonus();

        this.options.experiences?.forEach(m => {
            if (this.options.data.experiences?.[m])
                this.options.roll.modifiers.push({
                    label: this.options.data.experiences[m].name,
                    value: this.options.data.experiences[m].total ?? this.options.data.experiences[m].value
                });
        });

        this.options.roll.modifiers?.forEach(m => {
            this.terms.push(...this.formatModifier(m.value));
        });

        this.baseTerms = foundry.utils.deepClone(this.terms);

        if (this.options.extraFormula) {
            this.terms.push(
                new foundry.dice.terms.OperatorTerm({ operator: '+' }),
                ...this.constructor.parse(this.options.extraFormula, this.options.data)
            );
        }
    }

    applyAdvantage() {
        this.d20.modifiers.findSplice(m => ['kh', 'kl'].includes(m));
        if (!this.hasAdvantage && !this.hasDisadvantage) this.number = 1;
        else {
            this.d20.number = 2;
            this.d20.modifiers.push(this.hasAdvantage ? 'kh' : 'kl');
        }
    }

    applyBaseBonus() {
        this.options.roll.modifiers = [];
        if (!this.options.roll.bonus) return;
        this.options.roll.modifiers.push({
            label: 'Bonus to Hit',
            value: this.options.roll.bonus
            // value: Roll.replaceFormulaData('@attackBonus', this.data)
        });
    }

    static async buildEvaluate(roll, config = {}, message = {}) {
        if (config.evaluate !== false) await roll.evaluate();
        const advantageState =
            config.roll.advantage == this.ADV_MODE.ADVANTAGE
                ? true
                : config.roll.advantage == this.ADV_MODE.DISADVANTAGE
                  ? false
                  : null;
        setDiceSoNiceForDualityRoll(roll, advantageState);
        this.postEvaluate(roll, config);
    }

    static postEvaluate(roll, config = {}) {
        super.postEvaluate(roll, config);
        if (config.targets?.length) {
            config.targets.forEach(target => {
                const difficulty = config.roll.difficulty ?? target.difficulty ?? target.evasion;
                target.hit = this.isCritical || roll.total >= difficulty;
            });
        } else if (config.roll.difficulty)
            config.roll.success = roll.isCritical || roll.total >= config.roll.difficulty;
        config.roll.advantage = {
            type: config.roll.advantage,
            dice: roll.dAdvantage?.denomination,
            value: roll.dAdvantage?.total
        };
        config.roll.extra = roll.dice
            .filter(d => !roll.baseTerms.includes(d))
            .map(d => {
                return {
                    dice: d.denomination,
                    value: d.total
                };
            });
        config.roll.modifierTotal = 0;
        for (let i = 0; i < roll.terms.length; i++) {
            if (
                roll.terms[i] instanceof foundry.dice.terms.NumericTerm &&
                !!roll.terms[i - 1] &&
                roll.terms[i - 1] instanceof foundry.dice.terms.OperatorTerm
            )
                config.roll.modifierTotal += Number(`${roll.terms[i - 1].operator}${roll.terms[i].total}`);
        }
    }

    resetFormula() {
        return (this._formula = this.constructor.getFormula(this.terms));
    }
}

export class DualityRoll extends D20Roll {
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
            ? 'DAGGERHEART.General.Hope'
            : this.withFear
              ? 'DAGGERHEART.General.Fear'
              : 'DAGGERHEART.General.CriticalSuccess';

        return game.i18n.localize(label);
    }

    updateFormula() {}

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
            label: `DAGGERHEART.Abilities.${this.options.roll.trait}.name`,
            value: Roll.replaceFormulaData(`@traits.${this.options.roll.trait}.total`, this.data)
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
    }
}

export class DamageRoll extends DHRoll {
    constructor(formula, data = {}, options = {}) {
        super(formula, data, options);
    }

    static messageType = 'damageRoll';

    static DefaultDialog = DamageDialog;

    static async postEvaluate(roll, config = {}) {
        super.postEvaluate(roll, config);
        config.roll.type = config.type;
        if (config.source?.message) {
            const chatMessage = ui.chat.collection.get(config.source.message);
            chatMessage.update({ 'system.damage': config });
        }
    }
}
