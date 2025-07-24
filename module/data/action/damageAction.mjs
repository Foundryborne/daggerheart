import { setsEqual } from '../../helpers/utils.mjs';
import DHBaseAction from './baseAction.mjs';

export default class DHDamageAction extends DHBaseAction {
    static extraSchemas = [...super.extraSchemas, 'damage', 'target', 'effects'];

    getFormulaValue(part, data) {
        let formulaValue = part.value;
        if (this.hasRoll && part.resultBased && data.system.roll.result.duality === -1) return part.valueAlt;

        const isAdversary = this.actor.type === 'adversary';
        if (isAdversary && this.actor.system.type === CONFIG.DH.ACTOR.adversaryTypes.horde.id) {
            const hasHordeDamage = this.actor.effects.find(
                x => x.name === game.i18n.localize('DAGGERHEART.CONFIG.AdversaryType.horde.label')
            );
            if (hasHordeDamage) return part.valueAlt;
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
            formula: this.getFormulaValue(p, data).getFormula(this.actor),
            damageTypes: p.applyTo === 'hitPoints' && !p.type.size ? new Set(['physical']) : p.type,
            applyTo: p.applyTo
        }));

        if (!formulas.length) return;

        formulas = this.formatFormulas(formulas, systemData);

        const config = {
            title: game.i18n.format('DAGGERHEART.UI.Chat.damageRoll.title', { damage: game.i18n.localize(this.name) }),
            roll: formulas,
            targets: systemData.targets?.filter(t => t.hit) ?? data.targets,
            hasSave: this.hasSave,
            isCritical: systemData.roll?.isCritical ?? false,
            source: systemData.source,
            data: this.getRollData(),
            event
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
