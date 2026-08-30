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
 *  },
 *  isOptional,
 *  isExtra
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
        max: 3,
        reverse: true,
        label: 'DAGGERHEART.GENERAL.stress'
    }
});

export const optionalResources = {
    favor: {
        id: 'favor',
        initial: 3,
        max: 6,
        label: 'DAGGERHEART.CONFIG.Resources.optionalResources.favor',
        images: {
            full: { value: 'fa-solid fa-spaghetti-monster-flying', isIcon: true, opacity: 1 },
            empty: { value: 'fa-solid fa-spaghetti-monster-flying', isIcon: true, opacity: 0.6 }
        },
        isOptional: true,
        isExtra: true
    },
    focus: {
        id: 'focus',
        initial: 0,
        max: 6,
        label: 'DAGGERHEART.CONFIG.Resources.optionalResources.focus',
        images: {
            full: { value: 'fa-solid fa-yin-yang', isIcon: true, opacity: 1 },
            empty: { value: 'fa-solid fa-yin-yang', isIcon: true, opacity: 0.6 }
        },
        isOptional: true,
        isExtra: true
    }
};

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
