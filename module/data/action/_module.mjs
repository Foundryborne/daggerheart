import {
    DHAttackAction,
    DHBaseAction,
    DHDamageAction,
    DHEffectAction,
    DHHealingAction,
    DHMacroAction,
    // DHResourceAction,
    // DHSpellCastAction,
    DHSummonAction
} from './action.mjs';

export const actionsTypes = {
    base: DHBaseAction,
    attack: DHAttackAction,
    // spellcast: DHSpellCastAction,
    // resource: DHResourceAction,
    damage: DHDamageAction,
    healing: DHHealingAction,
    summon: DHSummonAction,
    effect: DHEffectAction,
    macro: DHMacroAction
};
