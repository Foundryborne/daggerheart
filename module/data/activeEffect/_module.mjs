import BaseEffect from './baseEffect.mjs';
import BeastformEffect from './beastformEffect.mjs';
import EphemeralEffect from './ephemeralEffect.mjs';
import HordeEffect from './hordeEffect.mjs';
export { changeTypes, changeEffects } from './changeTypes/_module.mjs';

export { BaseEffect, BeastformEffect, EphemeralEffect, HordeEffect };

export const config = {
    base: BaseEffect,
    beastform: BeastformEffect,
    horde: HordeEffect,
    ephemeral: EphemeralEffect
};
