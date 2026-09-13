import Armor from './armor.mjs';
import StandardAttack from './standardAttack.mjs';

export const changeEffects = {
    armor: Armor.changeEffect,
    standardAttack: StandardAttack.changeEffect
};

export const changeTypes = {
    armor: Armor,
    standardAttack: StandardAttack
};
