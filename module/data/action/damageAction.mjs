import { setsEqual } from '../../helpers/utils.mjs';
import DHBaseAction from './baseAction.mjs';

export default class DHDamageAction extends DHBaseAction {
    static extraSchemas = [...super.extraSchemas, 'damage', 'target', 'effects'];

    getFormulaValue(part, data) {
        let formulaValue = part.value;
        
        if (data.hasRoll && part.resultBased && data.roll.result.duality === -1) return part.valueAlt;

        const isAdversary = this.actor.type === 'adversary';
        if (isAdversary && this.actor.system.type === CONFIG.DH.ACTOR.adversaryTypes.horde.id) {
            const hasHordeDamage = this.actor.effects.find(x => x.type === 'horde');
            if (hasHordeDamage && !hasHordeDamage.disabled) return part.valueAlt;
        }

        return formulaValue;
    }

    formatFormulas(formulas, systemData) {
        const formattedFormulas = [];
        formulas.forEach(formula => {
            if (isNaN(formula.formula))
                formula.formula = Roll.replaceFormulaData(formula.formula, this.getRollData(systemData));
            const same = formattedFormulas.find(
                f => setsEqual(f.damageTypes, formula.damageTypes) && f.applyTo === formula.applyTo
            );
            if (same) same.formula += ` + ${formula.formula}`;
            else formattedFormulas.push(formula);
        });
        return formattedFormulas;
    }

    async rollDamage(event, data) {
        const systemData = data.system ?? data;

        let formulas = this.damage.parts.map(p => ({
            formula: this.getFormulaValue(p, systemData).getFormula(this.actor),
            damageTypes: p.applyTo === 'hitPoints' && !p.type.size ? new Set(['physical']) : p.type,
            applyTo: p.applyTo
        }));

        if (!formulas.length) return;

        formulas = this.formatFormulas(formulas, systemData);

        delete systemData.evaluate;
        const config = {
            ...systemData,
            roll: formulas,
            dialog: {},
            data: this.getRollData()
        };
        if (this.hasSave) config.onSave = this.save.damageMod;
        if (data.system) {
            config.source.message = data._id;
            config.directDamage = false;
        } else {
            config.directDamage = true;
        }

        return CONFIG.Dice.daggerheart.DamageRoll.build(config);
    }
}
