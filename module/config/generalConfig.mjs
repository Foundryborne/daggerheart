export const range = {
    self: {
        id: 'self',
        short: 's',
        label: 'DAGGERHEART.Range.self.name',
        description: 'DAGGERHEART.Range.self.description',
        distance: 0
    },
    melee: {
        id: 'melee',
        short: 'm',
        label: 'DAGGERHEART.Range.melee.name',
        description: 'DAGGERHEART.Range.melee.description',
        distance: 1
    },
    veryClose: {
        id: 'veryClose',
        short: 'vc',
        label: 'DAGGERHEART.Range.veryClose.name',
        description: 'DAGGERHEART.Range.veryClose.description',
        distance: 3
    },
    close: {
        id: 'close',
        short: 'c',
        label: 'DAGGERHEART.Range.close.name',
        description: 'DAGGERHEART.Range.close.description',
        distance: 10
    },
    far: {
        id: 'far',
        short: 'f',
        label: 'DAGGERHEART.Range.far.name',
        description: 'DAGGERHEART.Range.far.description',
        distance: 20
    },
    veryFar: {
        id: 'veryFar',
        short: 'vf',
        label: 'DAGGERHEART.Range.veryFar.name',
        description: 'DAGGERHEART.Range.veryFar.description',
        distance: 30
    }
};

export const burden = {
    oneHanded: {
        value: 'oneHanded',
        label: 'DAGGERHEART.Burden.oneHanded'
    },
    twoHanded: {
        value: 'twoHanded',
        label: 'DAGGERHEART.Burden.twoHanded'
    }
};

export const damageTypes = {
    physical: {
        id: 'physical',
        label: 'DAGGERHEART.DamageType.physical.name',
        abbreviation: 'DAGGERHEART.DamageType.physical.abbreviation'
    },
    magical: {
        id: 'magical',
        label: 'DAGGERHEART.DamageType.magical.name',
        abbreviation: 'DAGGERHEART.DamageType.magical.abbreviation'
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
    },
    hope: {
        id: 'hope',
        label: 'DAGGERHEART.HealingType.Hope.Name',
        abbreviation: 'DAGGERHEART.HealingType.Hope.Abbreviation'
    },
    armorStack: {
        id: 'armorStack',
        label: 'DAGGERHEART.HealingType.ArmorStack.Name',
        abbreviation: 'DAGGERHEART.HealingType.ArmorStack.Abbreviation'
    }
};

export const conditions = {
    vulnerable: {
        id: 'vulnerable',
        name: 'DAGGERHEART.Condition.vulnerable.name',
        icon: 'icons/magic/control/silhouette-fall-slip-prone.webp',
        description: 'DAGGERHEART.Condition.vulnerable.description'
    },
    hidden: {
        id: 'hidden',
        name: 'DAGGERHEART.Condition.hidden.name',
        icon: 'icons/magic/perception/silhouette-stealth-shadow.webp',
        description: 'DAGGERHEART.Condition.hidden.description'
    },
    restrained: {
        id: 'restrained',
        name: 'DAGGERHEART.Condition.restrained.name',
        icon: 'icons/magic/control/debuff-chains-shackle-movement-red.webp',
        description: 'DAGGERHEART.Condition.restrained.description'
    }
};

export const defaultRestOptions = {
    shortRest: () => ({
        tendToWounds: {
            id: 'tendToWounds',
            name: game.i18n.localize('DAGGERHEART.Downtime.ShortRest.TendToWounds.Name'),
            img: 'icons/magic/life/cross-worn-green.webp',
            description: game.i18n.localize('DAGGERHEART.Downtime.ShortRest.TendToWounds.Description'),
            actions: [
                {
                    type: 'healing',
                    name: game.i18n.localize('DAGGERHEART.Downtime.ShortRest.TendToWounds.Name'),
                    img: 'icons/magic/life/cross-worn-green.webp',
                    actionType: 'action',
                    healing: {
                        type: 'health',
                        value: {
                            custom: {
                                enabled: true,
                                formula: '1d4 + 1' // should be 1d4 + {tier}. How to use the roll param?
                            }
                        }
                    }
                }
            ]
        },
        clearStress: {
            id: 'clearStress',
            name: game.i18n.localize('DAGGERHEART.Downtime.ShortRest.ClearStress.Name'),
            img: 'icons/magic/perception/eye-ringed-green.webp',
            description: game.i18n.localize('DAGGERHEART.Downtime.ShortRest.ClearStress.Description'),
            actions: [
                {
                    type: 'healing',
                    name: game.i18n.localize('DAGGERHEART.Downtime.ShortRest.ClearStress.Name'),
                    img: 'icons/magic/perception/eye-ringed-green.webp',
                    actionType: 'action',
                    healing: {
                        type: 'stress',
                        value: {
                            custom: {
                                enabled: true,
                                formula: '1d4 + 1' // should be 1d4 + {tier}. How to use the roll param?
                            }
                        }
                    }
                }
            ]
        },
        repairArmor: {
            id: 'repairArmor',
            name: game.i18n.localize('DAGGERHEART.Downtime.ShortRest.RepairArmor.Name'),
            img: 'icons/skills/trades/smithing-anvil-silver-red.webp',
            description: game.i18n.localize('DAGGERHEART.Downtime.ShortRest.RepairArmor.Description')
        },
        prepare: {
            id: 'prepare',
            name: game.i18n.localize('DAGGERHEART.Downtime.ShortRest.Prepare.Name'),
            img: 'icons/skills/trades/academics-merchant-scribe.webp',
            description: game.i18n.localize('DAGGERHEART.Downtime.ShortRest.Prepare.Description')
        }
    }),
    longRest: () => ({
        tendToWounds: {
            id: 'tendToWounds',
            name: game.i18n.localize('DAGGERHEART.Downtime.LongRest.TendToWounds.Name'),
            img: 'icons/magic/life/cross-worn-green.webp',
            description: game.i18n.localize('DAGGERHEART.Downtime.LongRest.TendToWounds.Description')
        },
        clearStress: {
            id: 'clearStress',
            name: game.i18n.localize('DAGGERHEART.Downtime.LongRest.ClearStress.Name'),
            img: 'icons/magic/perception/eye-ringed-green.webp',
            description: game.i18n.localize('DAGGERHEART.Downtime.LongRest.ClearStress.Description')
        },
        repairArmor: {
            id: 'repairArmor',
            name: game.i18n.localize('DAGGERHEART.Downtime.LongRest.RepairArmor.Name'),
            img: 'icons/skills/trades/smithing-anvil-silver-red.webp',
            description: game.i18n.localize('DAGGERHEART.Downtime.LongRest.RepairArmor.Description')
        },
        prepare: {
            id: 'prepare',
            name: game.i18n.localize('DAGGERHEART.Downtime.LongRest.Prepare.Name'),
            img: 'icons/skills/trades/academics-merchant-scribe.webp',
            description: game.i18n.localize('DAGGERHEART.Downtime.LongRest.Prepare.Description')
        },
        workOnAProject: {
            id: 'workOnAProject',
            name: game.i18n.localize('DAGGERHEART.Downtime.LongRest.WorkOnAProject.Name'),
            img: 'icons/skills/social/thumbsup-approval-like.webp',
            description: game.i18n.localize('DAGGERHEART.Downtime.LongRest.WorkOnAProject.Description')
        }
    }),
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
    tier1: {
        id: 'tier1',
        label: 'DAGGERHEART.Tiers.tier1'
    },
    tier2: {
        id: 'tier2',
        label: 'DAGGERHEART.Tiers.tier2'
    },
    tier3: {
        id: 'tier3',
        label: 'DAGGERHEART.Tiers.tier3'
    },
    tier4: {
        id: 'tier4',
        label: 'DAGGERHEART.Tiers.tier4'
    }
};

export const objectTypes = {
    character: {
        name: 'TYPES.Actor.character'
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
    d10: 'd10',
    d12: 'd12',
    d20: 'd20'
};

export const multiplierTypes = {
    proficiency: 'Proficiency',
    spellcast: 'Spellcast',
    flat: 'Flat'
};

export const getDiceSoNicePresets = () => {
    const { diceSoNice } = game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.appearance);

    return {
        hope: {
            ...diceSoNice.hope,
            colorset: 'inspired',
            texture: 'bloodmoon',
            material: 'metal',
            font: 'Arial Black',
            system: 'standard'
        },
        fear: {
            ...diceSoNice.fear,
            colorset: 'bloodmoon',
            texture: 'bloodmoon',
            material: 'metal',
            font: 'Arial Black',
            system: 'standard'
        },
        advantage: {
            ...diceSoNice.advantage,
            colorset: 'bloodmoon',
            texture: 'bloodmoon',
            material: 'metal',
            font: 'Arial Black',
            system: 'standard'
        },
        disadvantage: {
            ...diceSoNice.disadvantage,
            colorset: 'bloodmoon',
            texture: 'bloodmoon',
            material: 'metal',
            font: 'Arial Black',
            system: 'standard'
        }
    };
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
        label: 'DAGGERHEART.HealingType.Stress.Name'
    },
    armor: {
        id: 'armor',
        label: 'Armor Stack'
    },
    hp: {
        id: 'hp',
        label: 'DAGGERHEART.HealingType.HitPoints.Name'
    },
    prayer: {
        id: 'prayer',
        label: 'Prayer Dice'
    },
    favor: {
        id: 'favor',
        label: 'Favor Points'
    },
    slayer: {
        id: 'slayer',
        label: 'Slayer Dice'
    }
};

export const countdownTypes = {
    spotlight: {
        id: 'spotlight',
        label: 'DAGGERHEART.Countdown.Type.Spotlight'
    },
    characterAttack: {
        id: 'characterAttack',
        label: 'DAGGERHEART.Countdown.Type.CharacterAttack'
    },
    custom: {
        id: 'custom',
        label: 'DAGGERHEART.Countdown.Type.Custom'
    }
};
export const rollTypes = {
    weapon: {
        id: 'weapon',
        label: 'DAGGERHEART.RollTypes.weapon.name'
    },
    spellcast: {
        id: 'spellcast',
        label: 'DAGGERHEART.RollTypes.spellcast.name'
    },
    ability: {
        id: 'ability',
        label: 'DAGGERHEART.RollTypes.ability.name'
    }
};

export const fearDisplay = {
    token: { value: 'token', label: 'DAGGERHEART.Settings.Appearance.FearDisplay.Token' },
    bar: { value: 'bar', label: 'DAGGERHEART.Settings.Appearance.FearDisplay.Bar' },
    hide: { value: 'hide', label: 'DAGGERHEART.Settings.Appearance.FearDisplay.Hide' }
};
