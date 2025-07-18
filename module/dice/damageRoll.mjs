import DamageDialog from '../applications/dialogs/damageDialog.mjs';
import DHRoll from './dhRoll.mjs';

export default class DamageRoll extends DHRoll {
    constructor(formula, data = {}, options = {}) {
        super(formula, data, options);
    }

    static messageType = 'damageRoll';

    static DefaultDialog = DamageDialog;

    static async buildEvaluate(rolls, config = {}, message = {}) {
        if ( config.evaluate !== false ) {
            for ( const roll of config.roll ) await roll.roll.evaluate();
        }
        config.roll = config.roll.map(r => this.postEvaluate(r.roll));
    }

    static postEvaluate(roll, config = {}) {
        return {
            ...super.postEvaluate(roll, config),
            type: config.type,
            modifierTotal: this.calculateTotalModifiers(roll)
        }
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
}
