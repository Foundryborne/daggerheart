import BaseEffect from './baseEffect.mjs';
import BeastformEffect from './beastformEffect.mjs';
import HordeEffect from './hordeEffect.mjs';
export { changeTypes, changeEffects } from './changeTypes/_module.mjs';

export { BaseEffect, BeastformEffect, HordeEffect };

export const config = {
    base: BaseEffect,
    beastform: BeastformEffect,
    horde: HordeEffect
};
