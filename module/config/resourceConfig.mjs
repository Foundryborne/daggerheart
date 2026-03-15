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

const characterBaseResources = Object.freeze({
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
        reverse: false,
        label: 'DAGGERHEART.GENERAL.hope'
    }
});

const adversaryBaseResources = Object.freeze({
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
});

const companionBaseResources = Object.freeze({
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
        reverse: false,
        label: 'DAGGERHEART.GENERAL.hope'
    }
});

export const character = {
    base: characterBaseResources,
    custom: {}, // module stuff goes here
    all: { ...characterBaseResources }
};

export const adversary = {
    base: adversaryBaseResources,
    custom: {}, // module stuff goes here
    all: { ...adversaryBaseResources }
};

export const companion = {
    base: companionBaseResources,
    custom: {}, // module stuff goes here
    all: { ...companionBaseResources }
};
