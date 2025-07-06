export const range = {
    self: {
        id: 'self',
        short: 's',
        label: 'DAGGERHEART.Config.Range.self.name',
        description: 'DAGGERHEART.Config.Range.self.description',
        distance: 0
    },
    melee: {
        id: 'melee',
        short: 'm',
        label: 'DAGGERHEART.Config.Range.melee.name',
        description: 'DAGGERHEART.Config.Range.melee.description',
        distance: 1
    },
    veryClose: {
        id: 'veryClose',
        short: 'vc',
        label: 'DAGGERHEART.Config.Range.veryClose.name',
        description: 'DAGGERHEART.Config.Range.veryClose.description',
        distance: 3
    },
    close: {
        id: 'close',
        short: 'c',
        label: 'DAGGERHEART.Config.Range.close.name',
        description: 'DAGGERHEART.Config.Range.close.description',
        distance: 10
    },
    far: {
        id: 'far',
        short: 'f',
        label: 'DAGGERHEART.Config.Range.far.name',
        description: 'DAGGERHEART.Config.Range.far.description',
        distance: 20
    },
    veryFar: {
        id: 'veryFar',
        short: 'vf',
        label: 'DAGGERHEART.Config.Range.veryFar.name',
        description: 'DAGGERHEART.Config.Range.veryFar.description',
        distance: 30
    }
};

export const burden = {
    oneHanded: {
        value: 'oneHanded',
        label: 'DAGGERHEART.Config.Burden.oneHanded'
    },
    twoHanded: {
        value: 'twoHanded',
        label: 'DAGGERHEART.Config.Burden.twoHanded'
    }
};

export const damageTypes = {
    physical: {
        id: 'physical',
        label: 'DAGGERHEART.Config.DamageType.physical.name',
        abbreviation: 'DAGGERHEART.Config.DamageType.physical.abbreviation'
    },
    magical: {
        id: 'magical',
        label: 'DAGGERHEART.Config.DamageType.magical.name',
        abbreviation: 'DAGGERHEART.Config.DamageType.magical.abbreviation'
    }
};

export const healingTypes = {
    hitPoints: {
        id: 'hitPoints',
        label: 'DAGGERHEART.Config.HealingType.hitPoints.name',
        abbreviation: 'DAGGERHEART.Config.HealingType.hitPoints.abbreviation'
    },
    stress: {
        id: 'stress',
        label: 'DAGGERHEART.Config.HealingType.stress.name',
        abbreviation: 'DAGGERHEART.Config.HealingType.stress.abbreviation'
    },
    hope: {
        id: 'hope',
        label: 'DAGGERHEART.Config.HealingType.hope.name',
        abbreviation: 'DAGGERHEART.Config.HealingType.hope.abbreviation'
    },
    armorStack: {
        id: 'armorStack',
        label: 'DAGGERHEART.Config.HealingType.armorStack.name',
        abbreviation: 'DAGGERHEART.Config.HealingType.armorStack.abbreviation'
    }
};

export const conditions = {
    vulnerable: {
        id: 'vulnerable',
        name: 'DAGGERHEART.Config.Condition.vulnerable.name',
        icon: 'icons/magic/control/silhouette-fall-slip-prone.webp',
        description: 'DAGGERHEART.Config.Condition.vulnerable.description'
    },
    hidden: {
        id: 'hidden',
        name: 'DAGGERHEART.Config.Condition.hidden.name',
        icon: 'icons/magic/perception/silhouette-stealth-shadow.webp',
        description: 'DAGGERHEART.Config.Condition.hidden.description'
    },
    restrained: {
        id: 'restrained',
        name: 'DAGGERHEART.Config.Condition.restrained.name',
        icon: 'icons/magic/control/debuff-chains-shackle-movement-red.webp',
        description: 'DAGGERHEART.Config.Condition.restrained.description'
    }
};

export const defaultRestOptions = {
    shortRest: () => ({
        tendToWounds: {
            id: 'tendToWounds',
            name: game.i18n.localize('DAGGERHEART.Applications.Downtime.shortRest.tendToWounds.name'),
            img: 'icons/magic/life/cross-worn-green.webp',
            description: game.i18n.localize('DAGGERHEART.Applications.Downtime.shortRest.tendToWounds.description'),
            actions: [
                {
                    type: 'healing',
                    name: game.i18n.localize('DAGGERHEART.Applications.Downtime.shortRest.tendToWounds.name'),
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
            name: game.i18n.localize('DAGGERHEART.Applications.Downtime.shortRest.clearStress.name'),
            img: 'icons/magic/perception/eye-ringed-green.webp',
            description: game.i18n.localize('DAGGERHEART.Applications.Downtime.shortRest.clearStress.description'),
            actions: [
                {
                    type: 'healing',
                    name: game.i18n.localize('DAGGERHEART.Applications.Downtime.shortRest.clearStress.name'),
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
            name: game.i18n.localize('DAGGERHEART.Applications.Downtime.shortRest.repairArmor.name'),
            img: 'icons/skills/trades/smithing-anvil-silver-red.webp',
            description: game.i18n.localize('DAGGERHEART.Applications.Downtime.shortRest.repairArmor.description'),
            actions: []
        },
        prepare: {
            id: 'prepare',
            name: game.i18n.localize('DAGGERHEART.Applications.Downtime.shortRest.prepare.name'),
            img: 'icons/skills/trades/academics-merchant-scribe.webp',
            description: game.i18n.localize('DAGGERHEART.Applications.Downtime.shortRest.prepare.description'),
            actions: []
        }
    }),
    longRest: () => ({
        tendToWounds: {
            id: 'tendToWounds',
            name: game.i18n.localize('DAGGERHEART.Applications.Downtime.longRest.tendToWounds.name'),
            img: 'icons/magic/life/cross-worn-green.webp',
            description: game.i18n.localize('DAGGERHEART.Applications.Downtime.longRest.tendToWounds.description'),
            actions: []
        },
        clearStress: {
            id: 'clearStress',
            name: game.i18n.localize('DAGGERHEART.Applications.Downtime.longRest.clearStress.name'),
            img: 'icons/magic/perception/eye-ringed-green.webp',
            description: game.i18n.localize('DAGGERHEART.Applications.Downtime.longRest.clearStress.description'),
            actions: []
        },
        repairArmor: {
            id: 'repairArmor',
            name: game.i18n.localize('DAGGERHEART.Applications.Downtime.longRest.repairArmor.name'),
            img: 'icons/skills/trades/smithing-anvil-silver-red.webp',
            description: game.i18n.localize('DAGGERHEART.Applications.Downtime.longRest.repairArmor.description'),
            actions: []
        },
        prepare: {
            id: 'prepare',
            name: game.i18n.localize('DAGGERHEART.Applications.Downtime.longRest.prepare.name'),
            img: 'icons/skills/trades/academics-merchant-scribe.webp',
            description: game.i18n.localize('DAGGERHEART.Applications.Downtime.longRest.prepare.description'),
            actions: []
        },
        workOnAProject: {
            id: 'workOnAProject',
            name: game.i18n.localize('DAGGERHEART.Applications.Downtime.longRest.workOnAProject.name'),
            img: 'icons/skills/social/thumbsup-approval-like.webp',
            description: game.i18n.localize('DAGGERHEART.Applications.Downtime.longRest.workOnAProject.description'),
            actions: []
        }
    }),
    custom: {
        id: 'customActivity',
        name: '',
        img: 'icons/skills/trades/academics-investigation-puzzles.webp',
        description: '',
        namePlaceholder: 'DAGGERHEART.Applications.Downtime.custom.namePlaceholder',
        placeholder: 'DAGGERHEART.Applications.Downtime.custom.placeholder'
    }
};

export const deathMoves = {
    avoidDeath: {
        id: 'avoidDeath',
        name: 'DAGGERHEART.Config.DeathMoves.avoidDeath.name',
        img: 'icons/magic/time/hourglass-yellow-green.webp',
        description: 'DAGGERHEART.Config.DeathMoves.avoidDeath.description'
    },
    riskItAll: {
        id: 'riskItAll',
        name: 'DAGGERHEART.Config.DeathMoves.riskItAll.name',
        img: 'icons/sundries/gaming/dice-pair-white-green.webp',
        description: 'DAGGERHEART.Config.DeathMoves.riskItAll.description'
    },
    blazeOfGlory: {
        id: 'blazeOfGlory',
        name: 'DAGGERHEART.Config.DeathMoves.blazeOfGlory.name',
        img: 'icons/magic/life/heart-cross-strong-flame-purple-orange.webp',
        description: 'DAGGERHEART.Config.DeathMoves.blazeOfGlory.description'
    }
};

export const tiers = {
    tier1: {
        id: 'tier1',
        label: 'DAGGERHEART.General.Tiers.tier1',
        value: 1
    },
    tier2: {
        id: 'tier2',
        label: 'DAGGERHEART.General.Tiers.tier2',
        value: 2
    },
    tier3: {
        id: 'tier3',
        label: 'DAGGERHEART.General.Tiers.tier3',
        value: 3
    },
    tier4: {
        id: 'tier4',
        label: 'DAGGERHEART.General.Tiers.tier4',
        value: 4
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
    prof: 'Proficiency',
    cast: 'Spellcast',
    scale: 'Cost Scaling',
    result: 'Roll Result',
    flat: 'Flat'
};

export const diceSetNumbers = {
    prof: 'Proficiency',
    cast: 'Spellcast',
    scale: 'Cost Scaling',
    flat: 'Flat'
};

export const getDiceSoNicePresets = () => {
    const { diceSoNice } = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.appearance);

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
        label: 'DAGGERHEART.General.RefreshType.session'
    },
    shortRest: {
        id: 'shortRest',
        label: 'DAGGERHEART.General.RefreshType.shortrest'
    },
    longRest: {
        id: 'longRest',
        label: 'DAGGERHEART.General.RefreshType.longrest'
    }
};

export const abilityCosts = {
    hope: {
        id: 'hope',
        label: 'Hope',
        group: 'TYPES.Actor.character'
    },
    stress: {
        id: 'stress',
        label: 'DAGGERHEART.Config.HealingType.Stress.Name',
        group: 'TYPES.Actor.character'
    },
    armor: {
        id: 'armor',
        label: 'Armor Stack',
        group: 'TYPES.Actor.character'
    },
    hp: {
        id: 'hp',
        label: 'DAGGERHEART.Config.HealingType.HitPoints.Name',
        group: 'TYPES.Actor.character'
    },
    prayer: {
        id: 'prayer',
        label: 'Prayer Dice',
        group: 'TYPES.Actor.character'
    },
    favor: {
        id: 'favor',
        label: 'Favor Points',
        group: 'TYPES.Actor.character'
    },
    slayer: {
        id: 'slayer',
        label: 'Slayer Dice',
        group: 'TYPES.Actor.character'
    },
    tide: {
        id: 'tide',
        label: 'Tide',
        group: 'TYPES.Actor.character'
    },
    chaos: {
        id: 'chaos',
        label: 'Chaos',
        group: 'TYPES.Actor.character'
    },
    fear: {
        id: 'fear',
        label: 'Fear',
        group: 'TYPES.Actor.adversary'
    }
};

export const countdownTypes = {
    spotlight: {
        id: 'spotlight',
        label: 'DAGGERHEART.Config.CountdownTypes.Spotlight'
    },
    characterAttack: {
        id: 'characterAttack',
        label: 'DAGGERHEART.Config.CountdownTypes.CharacterAttack'
    },
    custom: {
        id: 'custom',
        label: 'DAGGERHEART.Config.CountdownTypes.Custom'
    }
};
export const rollTypes = {
    weapon: {
        id: 'weapon',
        label: 'DAGGERHEART.Config.RollTypes.weapon.name'
    },
    spellcast: {
        id: 'spellcast',
        label: 'DAGGERHEART.Config.RollTypes.spellcast.name'
    },
    ability: {
        id: 'ability',
        label: 'DAGGERHEART.Config.RollTypes.ability.name'
    },
    diceSet: {
        id: 'diceSet',
        label: 'DAGGERHEART.Config.RollTypes.diceSet.name'
    }
};

export const fearDisplay = {
    token: { value: 'token', label: 'DAGGERHEART.Settings.Appearance.fearDisplay.token' },
    bar: { value: 'bar', label: 'DAGGERHEART.Settings.Appearance.fearDisplay.bar' },
    hide: { value: 'hide', label: 'DAGGERHEART.Settings.Appearance.fearDisplay.hide' }
};
