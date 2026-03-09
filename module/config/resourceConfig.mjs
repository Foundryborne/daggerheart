/**
 *  Full custom typing:
 *  id
 *  initial
 *  max
 *  reverse
 *  label
 *  images {
 *    full { value, isIcon, noColorFilter }
 *    empty { value, isIcon noColorFilter }
 *  }
 */

export const characterBaseResources = {
    hitPoints: {
        id: 'hitPoints',
        initial: 0,
        max: 0,
        reverse: true,
        label: 'DAGGERHEART.GENERAL.HitPoints.plural',
        maxLabel: 'DAGGERHEART.ACTORS.Character.maxHPBonus'
    },
    stress: {
        id: 'stress',
        initial: 0,
        max: 6,
        reverse: true,
        label: 'DAGGERHEART.GENERAL.stress'
    },
    hope: {
        id: 'hope',
        initial: 2,
        min: 0,
        reverse: false,
        label: 'DAGGERHEART.GENERAL.hope'
    }
};

export const characterResources = {
    ...characterBaseResources
};

export const allCharacterResources = () => {
    const resources = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).resources.character
        .resources;
    return {
        ...Object.keys(resources).reduce((acc, key) => {
            acc[key] = { ...resources[key].toObject(), id: key };
            return acc;
        }, {}),
        ...characterResources
    };
};

export const adversaryBaseResources = {
    hitPoints: {
        id: 'hitPoints',
        initial: 0,
        max: 0,
        reverse: true,
        label: 'DAGGERHEART.GENERAL.HitPoints.plural',
        maxLabel: 'DAGGERHEART.ACTORS.Character.maxHPBonus'
    },
    stress: {
        id: 'stress',
        initial: 0,
        max: 0,
        reverse: true,
        label: 'DAGGERHEART.GENERAL.stress'
    }
};

export const adversaryResources = {
    ...adversaryBaseResources
};

export const allAdversaryResources = () => adversaryResources;

export const companionBaseResources = {
    stress: {
        id: 'stress',
        initial: 0,
        max: 0,
        reverse: true,
        label: 'DAGGERHEART.GENERAL.stress'
    },
    hope: {
        id: 'hope',
        initial: 0,
        min: 0,
        reverse: false,
        label: 'DAGGERHEART.GENERAL.hope'
    }
};

export const companionResources = {
    ...companionBaseResources
};

export const allCompanionResources = () => companionResources;
