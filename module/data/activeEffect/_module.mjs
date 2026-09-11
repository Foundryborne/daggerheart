import BaseEffect from './baseEffect.mjs';
import BeastformEffect from './beastformEffect.mjs';
import EphemeralEffect from './ephemeralEffect.mjs';
export { changeTypes, changeEffects } from './changeTypes/_module.mjs';
export { conditionalTypes as ActiveEffectConditionalTypes } from './conditionalTypes/_module.mjs';

export { BaseEffect, BeastformEffect, EphemeralEffect };

export const config = {
    base: BaseEffect,
    beastform: BeastformEffect,
    ephemeral: EphemeralEffect
};
