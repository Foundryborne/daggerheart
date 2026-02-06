import BaseEffect from './baseEffect.mjs';
import BeastformEffect from './beastformEffect.mjs';
import HordeEffect from './hordeEffect.mjs';
import ArmorEffect from './armorEffect.mjs';

export { BaseEffect, BeastformEffect, HordeEffect, ArmorEffect };

export const config = {
    base: BaseEffect,
    beastform: BeastformEffect,
    horde: HordeEffect,
    armor: ArmorEffect
};
