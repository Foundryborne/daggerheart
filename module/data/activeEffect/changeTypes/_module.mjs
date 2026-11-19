import Armor from './armor.mjs';
import Bonus from './bonus.mjs';
import BonusAdjustment from './bonusAdjustment.mjs';
import StandardAttack from './standardAttack.mjs';
import DamageReduction from './damageReduction.mjs';

export const changeEffects = {
    armor: Armor.changeEffect,
    bonus: Bonus.changeEffect,
    bonusAdjustment: BonusAdjustment.changeEffect,
    standardAttack: StandardAttack.changeEffect,
    damageReduction: DamageReduction.changeEffect
};

// Note: Anything added here must also be added to CONFIG.DH.EFFECTS.customChangeTypes
export const changeTypes = {
    armor: Armor,
    bonus: Bonus,
    bonusAdjustment: BonusAdjustment,
    standardAttack: StandardAttack,
    damageReduction: DamageReduction
};
