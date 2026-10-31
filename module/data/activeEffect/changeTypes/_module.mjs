import Armor from './armor.mjs';
import StandardAttack from './standardAttack.mjs';
import DamageReduction from './damageReduction.mjs';

export const changeEffects = {
    armor: Armor.changeEffect,
    standardAttack: StandardAttack.changeEffect,
    damageReduction: DamageReduction.changeEffect
};

export const changeTypes = {
    armor: Armor,
    standardAttack: StandardAttack,
    damageReduction: DamageReduction
};
