import DHDamageAction from './damageAction.mjs';

export default class DHHealingAction extends DHDamageAction {
    static extraSchemas = [...super.extraSchemas, 'roll'];

    static getRollType(parent) {
        return 'spellcast';
    }
}
