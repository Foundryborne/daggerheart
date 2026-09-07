import Armor from './armor.mjs';
import StandardAttack from './standardAttack.mjs';
import Dice from './diceChange.mjs';

export const changeEffects = {
    armor: Armor.changeEffect,
    standardAttack: StandardAttack.changeEffect,
    dice: Dice.changeEffect
};

export const changeTypes = {
    armor: Armor,
    standardAttack: StandardAttack,
    dice: Dice
};
