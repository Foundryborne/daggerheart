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

export const conditionalPhases = {
    preparation: {
        id: 'preparation',
        label: 'DAGGERHEART.CONFIG.ConditionalPhase.preparation'
    },
    roll: {
        id: 'roll',
        label: 'DAGGERHEART.CONFIG.ConditionalPhase.roll'
    }
}

export const conditionalFailureModes = {
    suppress: {
        id: 'suppress',
        label: 'DAGGERHEART.CONFIG.ConditionalFailureMode.suppress'
    },
    remove: {
        id: 'remove',
        label: 'DAGGERHEART.CONFIG.ConditionalFailureMode.remove'
    }
}

export const conditionalTypes = {
    dataCompare: {
        id: 'dataCompare',
        label: 'DAGGERHEART.CONFIG.ConditionalType.dataCompare'
    },
    weaponRestriction: {
        id: 'weaponRestriction',
        label: 'DAGGERHEART.CONFIG.ConditionalType.weaponRestriction' 
    },
    actionType: {
        id: 'actionType',
        label: 'DAGGERHEART.CONFIG.ConditionalType.actionType'
    },
    damageType: {
        id: 'damageType',
        label: 'DAGGERHEART.CONFIG.ConditionalType.damageType'
    }
};

export const conditionalComparators = {
    less: {
        id: 'less',
        label: 'DAGGERHEART.CONFIG.ConditionalComparator.less'
    },
    lessEquals: {
        id: 'lessEquals',
        label: 'DAGGERHEART.CONFIG.ConditionalComparator.lessEquals'
    },
    equals: {
        id: 'equals',
        label: 'DAGGERHEART.CONFIG.ConditionalComparator.equals'
    },
    greaterEquals: {
        id: 'greaterEquals',
        label: 'DAGGERHEART.CONFIG.ConditionalComparator.greaterEquals'
    },
    greater: {
        id: 'greater',
        label: 'DAGGERHEART.CONFIG.ConditionalComparator.greater'
    },
    truthy: {
        id: 'truthy',
        label: 'DAGGERHEART.CONFIG.ConditionalComparator.truthy',
        ignoresValue: true
    },
    falsy: {
        id: 'falsy',
        label: 'DAGGERHEART.CONFIG.ConditionalComparator.falsy',
        ignoresValue: true
    }
};

export const weaponRestrictionType = {
    sameWeapon: {
        id: 'sameWeapon',
        label: 'DAGGERHEART.CONFIG.ConditionalWeaponRestrictionType.sameWeapon'
    },
    primary: {
        id: 'primary',
        label: 'DAGGERHEART.ITEMS.Weapon.primaryWeapon.full'
    },
    secondary: {
        id: 'secondary',
        label: 'DAGGERHEART.ITEMS.Weapon.secondaryWeapon.full'
    },
    anyWeapon: {
        id: 'anyWeapon',
        label: 'DAGGERHEART.CONFIG.ConditionalWeaponRestrictionType.anyWeapon'
    }
};

export const actionType = {
    action: {
        id: 'action',
        label: 'DAGGERHEART.GENERAL.Roll.action'
    },
    reaction: {
        id: 'reaction',
        label: 'DAGGERHEART.GENERAL.Roll.reaction'
    },
    attack: {
        id: 'attack',
        label: 'DAGGERHEART.GENERAL.Roll.attack'
    },
    trait: {
        id: 'trait',
        label: 'DAGGERHEART.GENERAL.Roll.trait'
    },
    spellcast: {
        id: 'spellcast',
        label: 'DAGGERHEART.GENERAL.Roll.spellcast'
    }
}