import { DHDamageData } from '../fields/action/damageField.mjs';
import DHDamageAction from './damageAction.mjs';

export default class DHAttackAction extends DHDamageAction {
    static extraSchemas = [...super.extraSchemas, 'roll', 'save'];

    static getRollType(parent) {
        return parent.parent.type === 'weapon' ? 'attack' : 'spellcast';
    }

    prepareData() {
        super.prepareData();
        if (!!this.item?.system?.attack) {
            if (this.damage.includeBase) {
                const baseDamage = this.getParentDamage();
                this.damage.parts.unshift(new DHDamageData(baseDamage));
            }
            if (this.roll.useDefault) {
                this.roll.trait = this.item.system.attack.roll.trait;
                this.roll.type = 'attack';
            }
        }
    }

    getParentDamage() {
        return {
            value: {
                multiplier: 'prof',
                dice: this.item?.system?.attack.damage.parts[0].value.dice,
                bonus: this.item?.system?.attack.damage.parts[0].value.bonus ?? 0
            },
            type: this.item?.system?.attack.damage.parts[0].type,
            base: true
        };
    }

    async use(event, options) {
        const result = await super.use(event, options);
        if (!result.message) return;

        if (result.message.system.action.roll?.type === 'attack') {
            const { updateCountdowns } = game.system.api.applications.ui.DhCountdowns;
            await updateCountdowns(CONFIG.DH.GENERAL.countdownProgressionTypes.characterAttack.id);
        }

        return result;
    }

    /**
     * Generate a localized label array for this item subtype.
     * @returns {(string | { value: string, icons: string[] })[]} An array of localized strings and damage label objects.
     */
    _getLabels() {
        const labels = [];
        const { roll, range, damage } = this;

        if (roll.trait) labels.push(game.i18n.localize(`DAGGERHEART.CONFIG.Traits.${roll.trait}.short`));
        if (range) labels.push(game.i18n.localize(`DAGGERHEART.CONFIG.Range.${range}.short`));

        const useAltDamage = this.actor?.effects?.find(x => x.type === 'horde')?.active;
        for (const { value, valueAlt, type } of damage.parts) {
            const usedValue = useAltDamage ? valueAlt : value;
            const str = Roll.replaceFormulaData(usedValue.getFormula(), this.actor?.getRollData() ?? {});

            const icons = Array.from(type)
                .map(t => CONFIG.DH.GENERAL.damageTypes[t]?.icon)
                .filter(Boolean);

            if (icons.length === 0) {
                labels.push(str);
            } else {
                labels.push({ value: str, icons });
            }
        }

        return labels;
    }
}
