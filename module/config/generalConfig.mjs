export const range = {
    melee: {
        label: 'DAGGERHEART.Range.Melee.Name',
        description: 'DAGGERHEART.Range.Melee.Description',
        distance: 1
    },
    veryClose: {
        label: 'DAGGERHEART.Range.VeryClose.Name',
        description: 'DAGGERHEART.Range.VeryClose.Description',
        distance: 3
    },
    close: {
        label: 'DAGGERHEART.Range.Close.Name',
        description: 'DAGGERHEART.Range.Close.Description',
        distance: 10
    },
    far: {
        label: 'DAGGERHEART.Range.Far.Name',
        description: 'DAGGERHEART.Range.Far.Description',
        distance: 20
    },
    veryFar: {
        label: 'DAGGERHEART.Range.VeryFar.Name',
        description: 'DAGGERHEART.Range.VeryFar.Description',
        distance: 30
    }
};

export const burden = {
    oneHanded: 'DAGGERHEART.Burden.OneHanded',
    twoHanded: 'DAGGERHEART.Burden.TwoHanded'
};

export const damageTypes = {
    physical: {
        id: 'physical',
        label: 'DAGGERHEART.DamageType.Physical.Name',
        abbreviation: 'DAGGERHEART.DamageType.Physical.Abbreviation'
    },
    magical: {
        id: 'magical',
        label: 'DAGGERHEART.DamageType.Magical.Name',
        abbreviation: 'DAGGERHEART.DamageType.Magical.Abbreviation'
    }
};

export const healingTypes = {
    health: {
        id: 'health',
        label: 'DAGGERHEART.HealingType.HitPoints.Name',
        abbreviation: 'DAGGERHEART.HealingType.HitPoints.Abbreviation'
    },
    stress: {
        id: 'stress',
        label: 'DAGGERHEART.HealingType.Stress.Name',
        abbreviation: 'DAGGERHEART.HealingType.Stress.Abbreviation'
    }
};

export const conditions = {
    vulnerable: {
        id: 'vulnerable',
        name: 'DAGGERHEART.Condition.Vulnerable.Name',
        icon: 'icons/magic/control/silhouette-fall-slip-prone.webp',
        description: 'DAGGERHEART.Condition.Vulnerable.Description'
    },
    hidden: {
        id: 'hidden',
        name: 'DAGGERHEART.Condition.Hidden.Name',
        icon: 'icons/magic/perception/silhouette-stealth-shadow.webp',
        description: 'DAGGERHEART.Condition.Hidden.Description'
    },
    restrained: {
        id: 'restrained',
        name: 'DAGGERHEART.Condition.Restrained.Name',
        icon: 'icons/magic/control/debuff-chains-shackle-movement-red.webp',
        description: 'DAGGERHEART.Condition.Restrained.Description'
    }
};

export const downtime = {
    shortRest: {
        tendToWounds: {
            id: 'tendToWounds',
            name: 'DAGGERHEART.Downtime.TendToWounds.Name',
            img: 'icons/magic/life/cross-worn-green.webp',
            description: 'DAGGERHEART.Downtime.TendToWounds.Description'
        },
        clearStress: {
            id: 'clearStress',
            name: 'DAGGERHEART.Downtime.ClearStress.Name',
            img: 'icons/magic/perception/eye-ringed-green.webp',
            description: 'DAGGERHEART.Downtime.ClearStress.Description'
        },
        repairArmor: {
            id: 'repairArmor',
            name: 'DAGGERHEART.Downtime.RepairArmor.Name',
            img: 'icons/skills/trades/smithing-anvil-silver-red.webp',
            description: 'DAGGERHEART.Downtime.RepairArmor.Description'
        },
        prepare: {
            id: 'prepare',
            name: 'DAGGERHEART.Downtime.Prepare.Name',
            img: 'icons/skills/trades/academics-merchant-scribe.webp',
            description: 'DAGGERHEART.Downtime.Prepare.Description'
        }
    },
    longRest: {
        tendToWounds: {
            id: 'tendToWounds',
            name: 'DAGGERHEART.Downtime.TendToWounds.Name',
            img: 'icons/magic/life/cross-worn-green.webp',
            description: 'DAGGERHEART.Downtime.TendToWounds.Description'
        },
        clearStress: {
            id: 'clearStress',
            name: 'DAGGERHEART.Downtime.ClearStress.Name',
            img: 'icons/magic/perception/eye-ringed-green.webp',
            description: 'DAGGERHEART.Downtime.ClearStress.Description'
        },
        repairArmor: {
            id: 'repairArmor',
            name: 'DAGGERHEART.Downtime.RepairArmor.Name',
            img: 'icons/skills/trades/smithing-anvil-silver-red.webp',
            description: 'DAGGERHEART.Downtime.RepairArmor.Description'
        },
        prepare: {
            id: 'prepare',
            name: 'DAGGERHEART.Downtime.Prepare.Name',
            img: 'icons/skills/trades/academics-merchant-scribe.webp',
            description: 'DAGGERHEART.Downtime.Prepare.Description'
        },
        workOnAProject: {
            id: 'workOnAProject',
            name: 'DAGGERHEART.Downtime.WorkOnAProject.Name',
            img: 'icons/skills/social/thumbsup-approval-like.webp',
            description: 'DAGGERHEART.Downtime.WorkOnAProject.Description'
        }
    },
    custom: {
        id: 'customActivity',
        name: '',
        img: 'icons/skills/trades/academics-investigation-puzzles.webp',
        description: '',
        namePlaceholder: 'DAGGERHEART.Downtime.Custom.NamePlaceholder',
        placeholder: 'DAGGERHEART.Downtime.Custom.Placeholder'
    }
};

export const deathMoves = {
    avoidDeath: {
        id: 'avoidDeath',
        name: 'DAGGERHEART.DeathMoves.AvoidDeath.Name',
        img: 'icons/magic/time/hourglass-yellow-green.webp',
        description: 'DAGGERHEART.DeathMoves.AvoidDeath.Description'
    },
    riskItAll: {
        id: 'riskItAll',
        name: 'DAGGERHEART.DeathMoves.RiskItAll.Name',
        img: 'icons/sundries/gaming/dice-pair-white-green.webp',
        description: 'DAGGERHEART.DeathMoves.RiskItAll.Description'
    },
    blazeOfGlory: {
        id: 'blazeOfGlory',
        name: 'DAGGERHEART.DeathMoves.BlazeOfGlory.Name',
        img: 'icons/magic/life/heart-cross-strong-flame-purple-orange.webp',
        description: 'DAGGERHEART.DeathMoves.BlazeOfGlory.Description'
    }
};

export const tiers = {
    0: {
        key: 0,
        id: 'tier0',
        name: 'DAGGERHEART.General.Tier.0'
    },
    1: {
        key: 1,
        id: 'tier1',
        name: 'DAGGERHEART.General.Tier.1'
    },
    2: {
        key: 2,
        id: 'tier2',
        name: 'DAGGERHEART.General.Tier.2'
    },
    3: {
        key: 3,
        id: 'tier3',
        name: 'DAGGERHEART.General.Tier.3'
    }
};

export const objectTypes = {
    pc: {
        name: 'TYPES.Actor.pc'
    },
    npc: {
        name: 'TYPES.Actor.npc'
    },
    adversary: {
        name: 'TYPES.Actor.adversary'
    },
    ancestry: {
        name: 'TYPES.Item.ancestry'
    },
    community: {
        name: 'TYPES.Item.community'
    },
    class: {
        name: 'TYPES.Item.class'
    },
    subclass: {
        name: 'TYPES.Item.subclass'
    },
    feature: {
        name: 'TYPES.Item.feature'
    },
    domainCard: {
        name: 'TYPES.Item.domainCard'
    },
    consumable: {
        name: 'TYPES.Item.consumable'
    },
    miscellaneous: {
        name: 'TYPES.Item.miscellaneous'
    },
    weapon: {
        name: 'TYPES.Item.weapon'
    },
    armor: {
        name: 'TYPES.Item.armor'
    }
};

export const diceTypes = {
    d4: 'd4',
    d6: 'd6',
    d8: 'd8',
    d12: 'd12',
    d20: 'd20'
};

export const refreshTypes = {
    session: {
        id: 'session',
        label: 'DAGGERHEART.General.RefreshType.Session'
    },
    shortRest: {
        id: 'shortRest',
        label: 'DAGGERHEART.General.RefreshType.Shortrest'
    },
    longRest: {
        id: 'longRest',
        label: 'DAGGERHEART.General.RefreshType.Longrest'
    }
};

export const abilityCosts = {
    hope: {
        id: 'hope',
        label: 'Hope'
    },
    stress: {
        id: 'stress',
        label: 'Stress'
    }
};
