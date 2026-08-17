import Armor from './armor.mjs';
import StandardAttack from './standardAttack.mjs';
import Ephemeral from './ephemeral.mjs';

export const changeEffects = {
    armor: Armor.changeEffect,
    standardAttack: StandardAttack.changeEffect,
    ephemeral: Ephemeral.changeEffect
};

export const changeTypes = {
    armor: Armor,
    standardAttack: StandardAttack,
    ephemeral: Ephemeral
};
