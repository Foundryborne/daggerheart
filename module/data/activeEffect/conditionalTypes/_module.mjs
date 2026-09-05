import DataCompareConditional from './dataCompareConditional.mjs';
import WeaponRestrictionConditional from './weaponRestrictionConditional.mjs';
import ActionTypeConditional from './actionTypeConditional.mjs';
import DamageTypeConditional from './damageTypeConditional.mjs';
import { conditionalTypes as types } from '../../../config/effectConfig.mjs';

export const conditionalTypes = {
    [types.dataCompare.id]: DataCompareConditional,
    [types.weaponRestriction.id]: WeaponRestrictionConditional,
    [types.actionType.id]: ActionTypeConditional,
    [types.damageType.id]: DamageTypeConditional
}