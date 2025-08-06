import DamageDialog from '../applications/dialogs/damageDialog.mjs';
import DHRoll from './dhRoll.mjs';

export default class DamageRoll extends DHRoll {
    constructor(formula, data = {}, options = {}) {
        super(formula, data, options);
    }

    static DefaultDialog = DamageDialog;

    static async buildEvaluate(roll, config = {}, message = {}) {
        if (config.evaluate !== false) for (const roll of config.roll) await roll.roll.evaluate();

        roll._evaluated = true;
        const parts = config.roll.map(r => this.postEvaluate(r));

        config.damage = this.unifyDamageRoll(parts);
        // config.targetSelection = config.targets?.length
    }

    static postEvaluate(roll, config = {}) {
        return {
            ...roll,
            ...super.postEvaluate(roll.roll, config),
            damageTypes: [...(roll.damageTypes ?? [])],
            roll: roll.roll,
            type: config.type,
            modifierTotal: this.calculateTotalModifiers(roll.roll)
        };
    }

    static async buildPost(roll, config, message) {
        if (game.modules.get('dice-so-nice')?.active) {
            const pool = foundry.dice.terms.PoolTerm.fromRolls(
                    Object.values(config.damage).flatMap(r => r.parts.map(p => p.roll))
                ),
                diceRoll = Roll.fromTerms([pool]);
            await game.dice3d.showForRoll(diceRoll, game.user, true);
        }
        await super.buildPost(roll, config, message);
        if (config.source?.message) {
            const chatMessage = ui.chat.collection.get(config.source.message);
            chatMessage.update({ 'system.damage': config.damage });
        }
    }

    static unifyDamageRoll(rolls) {
        const unified = {};
        rolls.forEach(r => {
            const resource = unified[r.applyTo] ?? { formula: '', total: 0, parts: [] };
            resource.formula += `${resource.formula !== '' ? ' + ' : ''}${r.formula}`;
            resource.total += r.total;
            resource.parts.push(r);
            unified[r.applyTo] = resource;
        });
        return unified;
    }

    static formatGlobal(rolls) {
        let formula, total;
        const applyTo = new Set(rolls.flatMap(r => r.applyTo));
        if (applyTo.size > 1) {
            const data = {};
            rolls.forEach(r => {
                if (data[r.applyTo]) {
                    data[r.applyTo].formula += ` + ${r.formula}`;
                    data[r.applyTo].total += r.total;
                } else {
                    data[r.applyTo] = {
                        formula: r.formula,
                        total: r.total
                    };
                }
            });
            formula = Object.entries(data).reduce((a, [k, v]) => a + ` ${k}: ${v.formula}`, '');
            total = Object.entries(data).reduce((a, [k, v]) => a + ` ${k}: ${v.total}`, '');
        } else {
            formula = rolls.map(r => r.formula).join(' + ');
            total = rolls.reduce((a, c) => a + c.total, 0);
        }
        return { formula, total };
    }

    applyBaseBonus(part) {
        const modifiers = [],
            type = this.options.messageType ?? (this.options.hasHealing ? 'healing' : 'damage'),
            options = part ?? this.options;

        modifiers.push(...this.getBonus(`${type}`, `${type.capitalize()} Bonus`));
        if (!this.options.hasHealing) {
            options.damageTypes?.forEach(t => {
                modifiers.push(...this.getBonus(`${type}.${t}`, `${t.capitalize()} ${type.capitalize()} Bonus`));
            });
            const weapons = ['primaryWeapon', 'secondaryWeapon'];
            weapons.forEach(w => {
                if (this.options.source.item && this.options.source.item === this.data[w]?.id)
                    modifiers.push(...this.getBonus(`${type}.${w}`, 'Weapon Bonus'));
            });
        }

        return modifiers;
    }

    constructFormula(config) {
        this.options.roll.forEach(part => {
            part.roll = new Roll(Roll.replaceFormulaData(part.formula, config.data));
            this.constructFormulaPart(config, part);
        });
        return this.options.roll;
    }

    constructFormulaPart(config, part) {
        part.roll.terms = Roll.parse(part.roll.formula, config.data);

        if (part.applyTo === CONFIG.DH.GENERAL.healingTypes.hitPoints.id) {
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
