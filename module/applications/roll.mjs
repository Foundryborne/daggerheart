import D20RollDialog from '../dialogs/d20RollDialog.mjs';
import DamageDialog from '../dialogs/damageDialog.mjs';

/*
    - Damage & other resources roll
    - Close dialog => don't roll
*/

export class DHRoll extends Roll {
    constructor(formula, data, options) {
        super(formula, data, options);
    }

    static async build(config = {}, message = {}) {
        const roll = await this.buildConfigure(config, message);
        if (!roll) return;
        await this.buildEvaluate(roll, config, (message = {}));
        await this.buildPost(roll, config, (message = {}));
        return roll;
    }

    static async buildConfigure(config = {}, message = {}) {
        config.hooks = [...(config.hooks ?? []), ''];
        config.dialog ??= {};
        for (const hook of config.hooks) {
            if (Hooks.call(`${SYSTEM.id}.preRoll${hook.capitalize()}`, config, message) === false) return null;
        }

        this.applyKeybindings(config);

        // let roll;
        // if(config.dialog?.configure === false) {
        //     roll = new this('', config.actor, config);
        // } else {
        if (config.dialog.configure !== false) {
            // Open Roll Dialog
            const DialogClass = config.dialog?.class ?? this.DefaultDialog;
            config = await DialogClass.configure(config, message);
            if (!config) return;
        }
        let roll = new this(config.formula, config.data, config);

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
        if (message.data) {
        } else {
            const messageData = {};
            await this.toMessage(roll, config);
        }
    }

    static async postEvaluate(roll, config = {}) {}

    static async toMessage(roll, config) {
        const cls = getDocumentClass('ChatMessage'),
            msg = {
                type: this.messageType,
                user: game.user.id,
                sound: config.mute ? null : CONFIG.sounds.dice,
                system: config,
                // content: this.messageTemplate,
                content: await this.messageTemplate(config),
                rolls: [roll]
            };
        await cls.create(msg);
    }

    static applyKeybindings(config) {
        config.dialog.configure ??= true;
    }
}

// DHopeDie
// DFearDie
// DualityDie
// D20Die

export class DualityDie extends foundry.dice.terms.Die {
    constructor({ number = 1, faces = 12, ...args } = {}) {
        super({ number, faces, ...args });
    }
}

export class D20Roll extends DHRoll {
    constructor(formula, data = {}, options = {}) {
        super(formula, data, options);
        this.createBaseDice();
        this.configureModifiers();

        this._formula = this.resetFormula();
    }

    static ADV_MODE = {
        NORMAL: 0,
        ADVANTAGE: 1,
        DISADVANTAGE: -1
    };

    static messageType = 'adversaryRoll';

    // static messageTemplate = 'systems/daggerheart/templates/chat/adversary-roll.hbs';

    static messageTemplate = async config => {
        return 'systems/daggerheart/templates/chat/adversary-roll.hbs';
    };

    static CRITICAL_TRESHOLD = 20;

    static DefaultDialog = D20RollDialog;

    get d20() {
        if (!(this.terms[0] instanceof foundry.dice.terms.Die)) this.createBaseDice();
        return this.terms[0];
    }

    set d20(faces) {
        if (!(this.terms[0] instanceof foundry.dice.terms.Die)) this.createBaseDice();
        this.terms[0].faces = faces;
    }

    get dAdvantage() {
        return this.dice[2];
    }

    get isCritical() {
        if (!this.d20._evaluated) return;
        return this.d20.total >= this.constructor.CRITICAL_TRESHOLD;
    }

    get hasAdvantage() {
        return this.options.advantage === this.constructor.ADV_MODE.ADVANTAGE;
    }

    get hasDisadvantage() {
        return this.options.advantage === this.constructor.ADV_MODE.DISADVANTAGE;
    }

    static applyKeybindings(config) {
        const keys = {
            normal: config.event.shiftKey || config.event.altKey || config.event.ctrlKey,
            advantage: config.event.altKey,
            disadvantage: config.event.ctrlKey
        };

        // Should the roll configuration dialog be displayed?
        config.dialog.configure ??= !Object.values(keys).some(k => k);

        // Determine advantage mode
        const advantage = config.advantage || keys.advantage;
        const disadvantage = config.disadvantage || keys.disadvantage;
        if (advantage && !disadvantage) config.advantage = this.ADV_MODE.ADVANTAGE;
        else if (!advantage && disadvantage) config.advantage = this.ADV_MODE.DISADVANTAGE;
        else config.advantage = this.ADV_MODE.NORMAL;
    }

    createBaseDice() {
        if (this.terms[0] instanceof foundry.dice.terms.Die) return;
        this.terms[0] = new foundry.dice.terms.Die({ faces: 20 });
    }

    applyAdvantage() {
        this.d20.modifiers.findSplice(m => ['kh', 'kl'].includes(m));
        if (!this.hasAdvantage && !this.hasAdvantage) this.number = 1;
        else {
            this.d20.number = 2;
            this.d20.modifiers.push(this.hasAdvantage ? 'kh' : 'kl');
        }
    }

    // Trait bonus != Adversary
    configureModifiers() {
        this.applyAdvantage();

        this.applyBaseBonus();

        this.options.experiences?.forEach(m => {
            if (this.options.data.experiences?.[m])
                this.options.roll.modifiers.push({
                    label: this.options.data.experiences[m].description,
                    value: this.options.data.experiences[m].total
                });
        });
        this.options.roll.modifiers?.forEach(m => {
            this.terms.push(...this.formatModifier(m.value));
        });

        if (this.options.extraFormula)
            this.terms.push(
                new foundry.dice.terms.OperatorTerm({ operator: '+' }),
                ...this.constructor.parse(this.options.extraFormula, this.getRollData())
            );

        // this.resetFormula();
    }

    applyBaseBonus() {
        if (this.options.type === 'attack')
            this.terms.push(...this.formatModifier(this.options.data.attack.roll.bonus));
    }

    static async postEvaluate(roll, config = {}) {
        if (config.targets?.length) {
            config.targets.forEach(target => {
                const difficulty = config.roll.difficulty ?? target.difficulty ?? target.evasion;
                target.hit = roll.total >= difficulty;
            });
        } else if (config.roll.difficulty) roll.success = roll.total >= config.roll.difficulty;
        config.roll.total = roll.total;
        config.roll.formula = roll.formula;
        config.roll.advantage = {
            type: config.advantage,
            dice: roll.dAdvantage?.denomination,
            value: roll.dAdvantage?.total
        };
        config.roll.modifierTotal = config.roll.modifiers.reduce((a, c) => a + c.value, 0);
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

    getRollData() {
        return this.options.data();
    }

    formatModifier(modifier) {
        const numTerm = modifier < 0 ? '-' : '+';
        return [
            new foundry.dice.terms.OperatorTerm({ operator: numTerm }),
            new foundry.dice.terms.NumericTerm({ number: Math.abs(modifier) })
        ];
    }

    resetFormula() {
        return (this._formula = this.constructor.getFormula(this.terms));
    }
}

export class DualityRoll extends D20Roll {
    constructor(formula, data = {}, options = {}) {
        super(formula, data, options);
    }

    static messageType = 'dualityRoll';

    // static messageTemplate = 'systems/daggerheart/templates/chat/duality-roll.hbs';

    static messageTemplate = async config => {
        return 'systems/daggerheart/templates/chat/duality-roll.hbs';
    };

    static DefaultDialog = D20RollDialog;

    get dHope() {
        // if ( !(this.terms[0] instanceof foundry.dice.terms.Die) ) return;
        if (!(this.dice[0] instanceof CONFIG.Dice.daggerheart.DualityDie)) this.createBaseDice();
        return this.dice[0];
        // return this.#hopeDice;
    }

    set dHope(faces) {
        if (!(this.dice[0] instanceof CONFIG.Dice.daggerheart.DualityDie)) this.createBaseDice();
        this.terms[0].faces = faces;
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
        this.dice[1].faces = faces;
        // this.#fearDice = `d${face}`;
    }

    get dAdvantage() {
        return this.dice[2];
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

    createBaseDice() {
        if (
            this.dice[0] instanceof CONFIG.Dice.daggerheart.DualityDie &&
            this.dice[1] instanceof CONFIG.Dice.daggerheart.DualityDie
        )
            return;
        if (!(this.dice[0] instanceof CONFIG.Dice.daggerheart.DualityDie))
            this.terms[0] = new CONFIG.Dice.daggerheart.DualityDie();
        this.terms[1] = new foundry.dice.terms.OperatorTerm({ operator: '+' });
        if (!(this.dice[2] instanceof CONFIG.Dice.daggerheart.DualityDie))
            this.terms[2] = new CONFIG.Dice.daggerheart.DualityDie();
    }

    applyAdvantage() {
        const dieFaces = 6,
            bardRallyFaces = this.hasBarRally,
            advDie = new foundry.dice.terms.Die({ faces: dieFaces });
        if (this.hasAdvantage || this.hasDisadvantage || bardRallyFaces)
            this.terms.push(new foundry.dice.terms.OperatorTerm({ operator: '+' }));
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
        if (!this.options.roll.modifiers) this.options.roll.modifiers = [];
        if (this.options.roll?.trait)
            this.options.roll.modifiers.push({
                label: `DAGGERHEART.Abilities.${this.options.roll.trait}.name`,
                value: this.options.data.traits[this.options.roll.trait].total
            });
    }

    static async postEvaluate(roll, config = {}) {
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

    // static messageTemplate = 'systems/daggerheart/templates/chat/damage-roll.hbs';
    static messageTemplate = async config => {
        return await foundry.applications.handlebars.renderTemplate(
            config.messageTemplate ?? 'systems/daggerheart/templates/chat/damage-roll.hbs',
            config
        );
    };

    static DefaultDialog = DamageDialog;

    static async postEvaluate(roll, config = {}) {
        config.roll = {
            result: roll.total,
            dice: roll.dice
        };
        if (roll.healing) config.roll.type = roll.healing.type;
    }
}
