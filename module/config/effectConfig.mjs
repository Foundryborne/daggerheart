export const customChangeTypes = {
    armor: {
        id: 'armor',
        priority: 20,
        label: 'TYPES.ActiveEffect.armor'
    },
    standardAttack: {
        id: 'standardAttack'
    }
};

export const activeEffectArmorInteraction = {
    none: { id: 'none', label: 'DAGGERHEART.CONFIG.ArmorInteraction.none.label' },
    active: { id: 'active', label: 'DAGGERHEART.CONFIG.ArmorInteraction.active.label' },
    inactive: { id: 'inactive', label: 'DAGGERHEART.CONFIG.ArmorInteraction.inactive.label' }
};

export const activeEffectDurations = {
    temporary: {
        id: 'temporary',
        label: 'DAGGERHEART.CONFIG.ActiveEffectDuration.temporary'
    },
    act: {
        id: 'act',
        label: 'DAGGERHEART.CONFIG.ActiveEffectDuration.act'
    },
    scene: {
        id: 'scene',
        label: 'DAGGERHEART.CONFIG.ActiveEffectDuration.scene'
    },
    shortRest: {
        id: 'shortRest',
        label: 'DAGGERHEART.CONFIG.ActiveEffectDuration.shortRest'
    },
    longRest: {
        id: 'longRest',
        label: 'DAGGERHEART.CONFIG.ActiveEffectDuration.longRest'
    },
    session: {
        id: 'session',
        label: 'DAGGERHEART.CONFIG.ActiveEffectDuration.session'
    },
    custom: {
        id: 'custom',
        label: 'DAGGERHEART.CONFIG.ActiveEffectDuration.custom'
    }
};