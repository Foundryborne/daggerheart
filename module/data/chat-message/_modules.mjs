import DHAbilityUse from "./abilityUse.mjs";
import DHAdversaryRoll from "./adversaryRoll.mjs";
import DHDamageRoll from "./damageRoll.mjs";
import DHDualityRoll from "./dualityRoll.mjs";
import DHApplyEffect from './applyEffects.mjs'

export {
  DHAbilityUse,
  DHAdversaryRoll,
  DHDamageRoll,
  DHDualityRoll,
  DHApplyEffect
}

export const config = {
  abilityUse: DHAbilityUse,
  adversaryRoll: DHAdversaryRoll,
  damageRoll: DHDamageRoll,
  dualityRoll: DHDualityRoll,
  applyEffect: DHApplyEffect
};
