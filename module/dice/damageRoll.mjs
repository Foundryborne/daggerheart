import DamageDialog from '../applications/dialogs/damageDialog.mjs';
import DHRoll from './dhRoll.mjs';

export default class DamageRoll extends DHRoll {
    constructor(formula, data = {}, options = {}) {
        super(formula, data, options);
    }

    static messageType = 'damageRoll';

    static DefaultDialog = DamageDialog;

    static async postEvaluate(roll, config = {}) {
        super.postEvaluate(roll, config);
        config.roll.type = config.type;
        config.roll.modifierTotal = this.calculateTotalModifiers(roll);
    }

    static async buildPost(roll, config, message) {
        await super.buildPost(roll, config, message);
        if (config.source?.message) {
            const chatMessage = ui.chat.collection.get(config.source.message);
            chatMessage.update({ 'system.damage': config });
        }
    }

    applyBaseBonus(part) {
        const modifiers = [],
            type = this.options.messageType ?? 'damage',
            options = part ?? this.options;

        modifiers.push(...this.getBonus(`${type}`, `${type.capitalize()} Bonus`));
        options.damageTypes?.forEach(t => {
            modifiers.push(...this.getBonus(`${type}.${t}`, `${t.capitalize()} ${type.capitalize()} Bonus`));
        });
        const weapons = ['primaryWeapon', 'secondaryWeapon'];
        weapons.forEach(w => {
            if (this.options.source.item && this.options.source.item === this.data[w]?.id)
                modifiers.push(...this.getBonus(`${type}.${w}`, 'Weapon Bonus'));
        });

        return modifiers;
    }

    constructFormula(config) {
        this.options.roll.forEach( part => {
            part.roll = new Roll(part.formula);
            this.constructFormulaPart(config, part)
        })
        return this.options.roll;
    }

    constructFormulaPart(config, part) {
        part.roll.terms = Roll.parse(part.roll.formula, config.data);

        if(part.applyTo === CONFIG.DH.GENERAL.healingTypes.hitPoints.id) {
            part.modifiers = this.applyBaseBonus(part);
            this.addModifiers(part);
            part.modifiers?.forEach(m => {
                part.roll.terms.push(...this.formatModifier(m.value));
            });
        }

        if (part.extraFormula) {
            part.roll.terms.push(
                new foundry.dice.terms.OperatorTerm({ operator: '+' }),
                ...this.constructor.parse(part.extraFormula, this.options.data)
            );
        }
        
        if (config.isCritical && part.applyTo === CONFIG.DH.GENERAL.healingTypes.hitPoints.id) {
            const tmpRoll = Roll.fromTerms(part.roll.terms)._evaluateSync({ maximize: true }),
                criticalBonus = tmpRoll.total - this.constructor.calculateTotalModifiers(tmpRoll);
            part.roll.terms.push(...this.formatModifier(criticalBonus));
        }
        return (part.roll._formula = this.constructor.getFormula(part.roll.terms));
    }

    async evaluate({minimize=false, maximize=false, allowStrings=false, allowInteractive=true, ...options}={}) {
        if ( this._evaluated ) {
            throw new Error(`The ${this.constructor.name} has already been evaluated and is now immutable`);
        }
        this._evaluated = true;
        if ( CONFIG.debug.dice ) console.debug(`Evaluating roll with formula "${this.formula}"`);

        // Migration path for async rolls
        if ( "async" in options ) {
            foundry.utils.logCompatibilityWarning("The async option for Roll#evaluate has been removed. "
                + "Use Roll#evaluateSync for synchronous roll evaluation.");
        }
        
        this.options.roll.forEach( async part => {
            await part.roll.evaluate({minimize, maximize, allowStrings, allowInteractive, ...options})
        })
        // return this._evaluate({minimize, maximize, allowStrings, allowInteractive});
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
}
