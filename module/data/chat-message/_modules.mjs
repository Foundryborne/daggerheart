import DHAbilityUse from './abilityUse.mjs';
import DHActorRoll from './actorRoll.mjs';
import DHGroupRoll from './groupRoll.mjs';
import DHSystemMessage from './systemMessage.mjs';

export const config = {
    abilityUse: DHAbilityUse,
    adversaryRoll: DHActorRoll,
    damageRoll: DHActorRoll,
    dualityRoll: DHActorRoll,
    fateRoll: DHActorRoll,
    groupRoll: DHGroupRoll,
    systemMessage: DHSystemMessage
};
