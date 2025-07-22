import { DHDamageData } from './actionDice.mjs';
import DHDamageAction from './damageAction.mjs';

export default class DHAttackAction extends DHDamageAction {
    static extraSchemas = [...super.extraSchemas, ...['roll', 'save']];

    static getRollType(parent) {
        return parent.type === 'weapon' ? 'attack' : 'spellcast';
    }

    get chatTemplate() {
        return 'systems/daggerheart/templates/ui/chat/duality-roll.hbs';
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

    async use(event, ...args) {
        const result = await super.use(event, args);

        const { updateCountdowns } = game.system.api.applications.ui.DhCountdowns;
        await updateCountdowns(CONFIG.DH.GENERAL.countdownTypes.characterAttack.id);

        return result;
    }

    // get modifiers() {
    //     return [];
    // }
}
