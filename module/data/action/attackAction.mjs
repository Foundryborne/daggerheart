import { DHDamageData } from './actionDice.mjs';
import DHDamageAction from './damageAction.mjs';

export default class DHAttackAction extends DHDamageAction {
    static extraSchemas = [...super.extraSchemas, ...['roll', 'save']];

    static getRollType(parent) {
        return parent.type === 'weapon' ? 'weapon' : 'spellcast';
    }

    get chatTemplate() {
        return 'systems/daggerheart/templates/ui/chat/duality-roll.hbs';
    }

    prepareData() {
        super.prepareData();
        if (this.damage.includeBase && !!this.item?.system?.damage) {
            const baseDamage = this.getParentDamage();
            this.damage.parts.unshift(new DHDamageData(baseDamage));
        }
    }

    getParentDamage() {
        return {
            value: {
                multiplier: 'prof',
                dice: this.item?.system?.damage.dice,
                bonus: this.item?.system?.damage.bonus ?? 0
            },
            type: this.item?.system?.damage.type,
            base: true
        };
    }
}
