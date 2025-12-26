import BaseEffect from './baseEffect.mjs';
import BeastformEffect from './beastformEffect.mjs';
import CompanionEffect from './companionEffect.mjs';
import HordeEffect from './hordeEffect.mjs';

export { BaseEffect, BeastformEffect, HordeEffect };

export const config = {
    base: BaseEffect,
    beastform: BeastformEffect,
    companion: CompanionEffect,
    horde: HordeEffect
};
