import BaseEffect from './baseEffect.mjs';
import BeastformEffect from './beastformEffect.mjs';
export { changeTypes, changeEffects } from './changeTypes/_module.mjs';
export { conditionalTypes as ActiveEffectConditionalTypes } from './conditionalTypes/_module.mjs';

export { BaseEffect, BeastformEffect };

export const config = {
    base: BaseEffect,
    beastform: BeastformEffect
};
