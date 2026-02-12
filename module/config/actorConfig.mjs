export const abilities = {
    agility: {
        id: 'agility',
        label: 'DAGGERHEART.CONFIG.Traits.agility.name',
        verbs: [
            'DAGGERHEART.CONFIG.Traits.agility.verb.sprint',
            'DAGGERHEART.CONFIG.Traits.agility.verb.leap',
            'DAGGERHEART.CONFIG.Traits.agility.verb.maneuver'
        ]
    },
    strength: {
        id: 'strength',
        label: 'DAGGERHEART.CONFIG.Traits.strength.name',
        verbs: [
            'DAGGERHEART.CONFIG.Traits.strength.verb.lift',
            'DAGGERHEART.CONFIG.Traits.strength.verb.smash',
            'DAGGERHEART.CONFIG.Traits.strength.verb.grapple'
        ]
    },
    finesse: {
        id: 'finesse',
        label: 'DAGGERHEART.CONFIG.Traits.finesse.name',
        verbs: [
            'DAGGERHEART.CONFIG.Traits.finesse.verb.control',
            'DAGGERHEART.CONFIG.Traits.finesse.verb.hide',
            'DAGGERHEART.CONFIG.Traits.finesse.verb.tinker'
        ]
    },
    instinct: {
        id: 'instinct',
        label: 'DAGGERHEART.CONFIG.Traits.instinct.name',
        verbs: [
            'DAGGERHEART.CONFIG.Traits.instinct.verb.perceive',
            'DAGGERHEART.CONFIG.Traits.instinct.verb.sense',
            'DAGGERHEART.CONFIG.Traits.instinct.verb.navigate'
        ]
    },
    presence: {
        id: 'presence',
        label: 'DAGGERHEART.CONFIG.Traits.presence.name',
        verbs: [
            'DAGGERHEART.CONFIG.Traits.presence.verb.charm',
            'DAGGERHEART.CONFIG.Traits.presence.verb.perform',
            'DAGGERHEART.CONFIG.Traits.presence.verb.deceive'
        ]
    },
    knowledge: {
        id: 'knowledge',
        label: 'DAGGERHEART.CONFIG.Traits.knowledge.name',
        verbs: [
            'DAGGERHEART.CONFIG.Traits.knowledge.verb.recall',
            'DAGGERHEART.CONFIG.Traits.knowledge.verb.analyze',
            'DAGGERHEART.CONFIG.Traits.knowledge.verb.comprehend'
        ]
    }
};

export const scrollingTextResource = {
    hitPoints: {
        label: 'DAGGERHEART.GENERAL.HitPoints.plural',
        reversed: true
    },
    stress: {
        label: 'DAGGERHEART.GENERAL.stress',
        reversed: true
    },
    hope: {
        label: 'DAGGERHEART.GENERAL.hope'
    },
    armor: {
        label: 'DAGGERHEART.GENERAL.armor',
        reversed: true
    }
};

export const featureProperties = {
    agility: {
        name: 'DAGGERHEART.CONFIG.Traits.agility.name',
        path: actor => actor.system.traits.agility.data.value
    },
    strength: {
        name: 'DAGGERHEART.CONFIG.Traits.strength.name',
        path: actor => actor.system.traits.strength.data.value
    },
    finesse: {
        name: 'DAGGERHEART.CONFIG.Traits.finesse.name',
        path: actor => actor.system.traits.finesse.data.value
    },
    instinct: {
        name: 'DAGGERHEART.CONFIG.Traits.instinct.name',
        path: actor => actor.system.traits.instinct.data.value
    },
    presence: {
        name: 'DAGGERHEART.CONFIG.Traits.presence.name',
        path: actor => actor.system.traits.presence.data.value
    },
    knowledge: {
        name: 'DAGGERHEART.CONFIG.Traits.knowledge.name',
        path: actor => actor.system.traits.knowledge.data.value
    },
    spellcastingTrait: {
        name: 'DAGGERHEART.FeatureProperty.SpellcastingTrait',
        path: actor => actor.system.traits[actor.system.class.subclass.system.spellcastingTrait].data.value
    }
};

export const adversaryTypes = {
    bruiser: {
        id: 'bruiser',
        label: 'DAGGERHEART.CONFIG.AdversaryType.bruiser.label',
        description: 'DAGGERHEART.ACTORS.Adversary.bruiser.description',
        bpCost: 4
    },
    horde: {
        id: 'horde',
        label: 'DAGGERHEART.CONFIG.AdversaryType.horde.label',
        description: 'DAGGERHEART.ACTORS.Adversary.horde.description',
        bpCost: 2
    },
    leader: {
        id: 'leader',
        label: 'DAGGERHEART.CONFIG.AdversaryType.leader.label',
        description: 'DAGGERHEART.ACTORS.Adversary.leader.description',
        bpCost: 3,
        bpDescription: 'DAGGERHEART.CONFIG.AdversaryType.leader.'
    },
    minion: {
        id: 'minion',
        label: 'DAGGERHEART.CONFIG.AdversaryType.minion.label',
        description: 'DAGGERHEART.ACTORS.Adversary.minion.description',
        bpCost: 1,
        partyAmountPerBP: true
    },
    ranged: {
        id: 'ranged',
        label: 'DAGGERHEART.CONFIG.AdversaryType.ranged.label',
        description: 'DAGGERHEART.ACTORS.Adversary.ranged.description',
        bpCost: 2
    },
    skulk: {
        id: 'skulk',
        label: 'DAGGERHEART.CONFIG.AdversaryType.skulk.label',
        description: 'DAGGERHEART.ACTORS.Adversary.skulk.description',
        bpCost: 2
    },
    social: {
        id: 'social',
        label: 'DAGGERHEART.CONFIG.AdversaryType.social.label',
        description: 'DAGGERHEART.ACTORS.Adversary.social.description',
        bpCost: 1
    },
    solo: {
        id: 'solo',
        label: 'DAGGERHEART.CONFIG.AdversaryType.solo.label',
        description: 'DAGGERHEART.ACTORS.Adversary.solo.description',
        bpCost: 5
    },
    standard: {
        id: 'standard',
        label: 'DAGGERHEART.CONFIG.AdversaryType.standard.label',
        description: 'DAGGERHEART.ACTORS.Adversary.standard.description',
        bpCost: 2
    },
    support: {
        id: 'support',
        label: 'DAGGERHEART.CONFIG.AdversaryType.support.label',
        description: 'DAGGERHEART.ACTORS.Adversary.support.description',
        bpCost: 1
    }
};

export const allAdversaryTypes = () => ({
    ...adversaryTypes,
    ...game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).adversaryTypes
});

export const environmentTypes = {
    exploration: {
        label: 'DAGGERHEART.CONFIG.EnvironmentType.exploration.label',
        description: 'DAGGERHEART.CONFIG.EnvironmentType.exploration.description'
    },
    social: {
        label: 'DAGGERHEART.CONFIG.EnvironmentType.social.label',
        description: 'DAGGERHEART.CONFIG.EnvironmentType.social.description'
    },
    traversal: {
        label: 'DAGGERHEART.CONFIG.EnvironmentType.traversal.label',
        description: 'DAGGERHEART.CONFIG.EnvironmentType.traversal.description'
    },
    event: {
        label: 'DAGGERHEART.CONFIG.EnvironmentType.event.label',
        description: 'DAGGERHEART.CONFIG.EnvironmentType.event.description'
    }
};

export const adversaryTraits = {
    relentless: {
        name: 'DAGGERHEART.CONFIG.AdversaryTrait.relentless.name',
        description: 'DAGGERHEART.CONFIG.AdversaryTrait.relentless.description',
        tip: 'DAGGERHEART.CONFIG.AdversaryTrait.relentless.tip'
    },
    slow: {
        name: 'DAGGERHEART.CONFIG.AdversaryTrait.slow.name',
        description: 'DAGGERHEART.CONFIG.AdversaryTrait.slow.description',
        tip: 'DAGGERHEART.CONFIG.AdversaryTrait.slow.tip'
    },
    minion: {
        name: 'DAGGERHEART.CONFIG.AdversaryTrait.slow.name',
        description: 'DAGGERHEART.CONFIG.AdversaryTrait.slow.description',
        tip: 'DAGGERHEART.CONFIG.AdversaryTrait.slow.tip'
    }
};

export const tokenSize = {
    custom: {
        id: 'custom',
        value: 0,
        label: 'DAGGERHEART.GENERAL.custom'
    },
    tiny: {
        id: 'tiny',
        value: 1,
        label: 'DAGGERHEART.CONFIG.TokenSize.tiny'
    },
    small: {
        id: 'small',
        value: 2,
        label: 'DAGGERHEART.CONFIG.TokenSize.small'
    },
    medium: {
        id: 'medium',
        value: 3,
        label: 'DAGGERHEART.CONFIG.TokenSize.medium'
    },
    large: {
        id: 'large',
        value: 4,
        label: 'DAGGERHEART.CONFIG.TokenSize.large'
    },
    huge: {
        id: 'huge',
        value: 5,
        label: 'DAGGERHEART.CONFIG.TokenSize.huge'
    },
    gargantuan: {
        id: 'gargantuan',
        value: 6,
        label: 'DAGGERHEART.CONFIG.TokenSize.gargantuan'
    }
};

export const levelChoices = {
    attributes: {
        name: 'attributes',
        title: '',
        choices: []
    },
    hitPointSlots: {
        name: 'hitPointSlots',
        title: '',
        choices: []
    },
    stressSlots: {
        name: 'stressSlots',
        title: '',
        choices: []
    },
    experiences: {
        name: 'experiences',
        title: '',
        choices: 'system.experiences',
        nrChoices: 2
    },
    proficiency: {
        name: 'proficiency',
        title: '',
        choices: []
    },
    armorOrEvasionSlot: {
        name: 'armorOrEvasionSlot',
        title: 'Permanently add one Armor Slot or take +1 to your Evasion',
        choices: [
            { name: 'Armor Marks +1', path: 'armor' },
            { name: 'Evasion +1', path: 'evasion' }
        ],
        nrChoices: 1
    },
    majorDamageThreshold2: {
        name: 'majorDamageThreshold2',
        title: '',
        choices: []
    },
    severeDamageThreshold2: {
        name: 'severeDamageThreshold2',
        title: '',
        choices: []
    },
    // minorDamageThreshold2: {
    //     name: 'minorDamageThreshold2',
    //     title: '',
    //     choices: [],
    // },
    severeDamageThreshold3: {
        name: 'severeDamageThreshold3',
        title: '',
        choices: []
    },
    // major2OrSevere4DamageThreshold: {
    //     name: 'major2OrSevere4DamageThreshold',
    //     title: 'Increase your Major Damage Threshold by +2 or Severe Damage Threshold by +4',
    //     choices: [{ name: 'Major Damage Threshold +2', path: 'major' }, { name: 'Severe Damage Threshold +4', path: 'severe' }],
    //     nrChoices: 1,
    // },
    // minor1OrMajor1DamageThreshold: {
    //     name: 'minor1OrMajor1DamageThreshold',
    //     title: 'Increase your Minor or Major Damage Threshold by +1',
    //     choices: [{ name: 'Minor Damage Threshold +1', path: 'minor' }, { name: 'Major Damage Threshold +1', path: 'major' }],
    //     nrChoices: 1,
    // },
    severeDamageThreshold4: {
        name: 'severeDamageThreshold4',
        title: '',
        choices: []
    },
    // majorDamageThreshold1: {
    //     name: 'majorDamageThreshold2',
    //     title: '',
    //     choices: [],
    // },
    subclass: {
        name: 'subclass',
        title: 'Select subclass to upgrade',
        choices: []
    },
    multiclass: {
        name: 'multiclass',
        title: '',
        choices: [{}]
    }
};

export const levelupData = {
    tier1: {
        id: '2_4',
        tier: 1,
        levels: [2, 3, 4],
        label: 'DAGGERHEART.APPLICATIONS.Levelup.tier1.Label',
        info: 'DAGGERHEART.APPLICATIONS.Levelup.tier1.InfoLabel',
        pretext: 'DAGGERHEART.APPLICATIONS.Levelup.tier1.Pretext',
        posttext: 'DAGGERHEART.APPLICATIONS.Levelup.tier1.Posttext',
        choices: {
            [levelChoices.attributes.name]: {
                description: 'DAGGERHEART.APPLICATIONS.Levelup.choiceDescriptions.attributes',
                maxChoices: 3
            },
            [levelChoices.hitPointSlots.name]: {
                description: 'DAGGERHEART.APPLICATIONS.Levelup.choiceDescriptions.hitPointSlots',
                maxChoices: 1
            },
            [levelChoices.stressSlots.name]: {
                description: 'DAGGERHEART.APPLICATIONS.Levelup.choiceDescriptions.stressSlots',
                maxChoices: 1
            },
            [levelChoices.experiences.name]: {
                description: 'DAGGERHEART.APPLICATIONS.Levelup.choiceDescriptions.experiences',
                maxChoices: 1
            },
            [levelChoices.proficiency.name]: {
                description: 'DAGGERHEART.APPLICATIONS.Levelup.choiceDescriptions.proficiency',
                maxChoices: 1
            },
            [levelChoices.armorOrEvasionSlot.name]: {
                description: 'DAGGERHEART.APPLICATIONS.Levelup.choiceDescriptions.armorOrEvasionSlot',
                maxChoices: 1
            },
            [levelChoices.majorDamageThreshold2.name]: {
                description: 'DAGGERHEART.APPLICATIONS.Levelup.choiceDescriptions.majorDamageThreshold2',
                maxChoices: 1
            },
            [levelChoices.severeDamageThreshold2.name]: {
                description: 'DAGGERHEART.APPLICATIONS.Levelup.choiceDescriptions.severeDamageThreshold2',
                maxChoices: 1
            }
        }
    },
    tier2: {
        id: '5_7',
        tier: 2,
        levels: [5, 6, 7],
        label: 'DAGGERHEART.APPLICATIONS.Levelup.tier2.Label',
        info: 'DAGGERHEART.APPLICATIONS.Levelup.tier2.InfoLabel',
        pretext: 'DAGGERHEART.APPLICATIONS.Levelup.tier2.Pretext',
        posttext: 'DAGGERHEART.APPLICATIONS.Levelup.tier2.Posttext',
        choices: {
            [levelChoices.attributes.name]: {
                description: 'DAGGERHEART.APPLICATIONS.Levelup.choiceDescriptions.attributes',
                maxChoices: 3
            },
            [levelChoices.hitPointSlots.name]: {
                description: 'DAGGERHEART.APPLICATIONS.Levelup.choiceDescriptions.hitPointSlots',
                maxChoices: 2
            },
            [levelChoices.stressSlots.name]: {
                description: 'DAGGERHEART.APPLICATIONS.Levelup.choiceDescriptions.stressSlots',
                maxChoices: 2
            },
            [levelChoices.experiences.name]: {
                description: 'DAGGERHEART.APPLICATIONS.Levelup.choiceDescriptions.experiences',
                maxChoices: 1
            },
            [levelChoices.proficiency.name]: {
                description: 'DAGGERHEART.APPLICATIONS.Levelup.choiceDescriptions.proficiency',
                maxChoices: 2
            },
            [levelChoices.armorOrEvasionSlot.name]: {
                description: 'DAGGERHEART.APPLICATIONS.Levelup.choiceDescriptions.armorOrEvasionSlot',
                maxChoices: 2
            },
            [levelChoices.majorDamageThreshold2.name]: {
                description: 'DAGGERHEART.APPLICATIONS.Levelup.choiceDescriptions.majorDamageThreshold2',
                maxChoices: 1
            },
            [levelChoices.severeDamageThreshold3.name]: {
                description: 'DAGGERHEART.APPLICATIONS.Levelup.choiceDescriptions.severeDamageThreshold3',
                maxChoices: 1
            },
            [levelChoices.subclass.name]: {
                description: 'DAGGERHEART.APPLICATIONS.Levelup.choiceDescriptions.subclass',
                maxChoices: 1
            },
            [levelChoices.multiclass.name]: {
                description: 'DAGGERHEART.APPLICATIONS.Levelup.choiceDescriptions.multiclass',
                maxChoices: 1,
                cost: 2
            }
        }
    },
    tier3: {
        id: '8_10',
        tier: 3,
        levels: [8, 9, 10],
        label: 'DAGGERHEART.APPLICATIONS.Levelup.tier3.Label',
        info: 'DAGGERHEART.APPLICATIONS.Levelup.tier3.InfoLabel',
        pretext: 'DAGGERHEART.APPLICATIONS.Levelup.tier3.Pretext',
        posttext: 'DAGGERHEART.APPLICATIONS.Levelup.tier3.Posttext',
        choices: {
            [levelChoices.attributes.name]: {
                description: 'DAGGERHEART.APPLICATIONS.Levelup.choiceDescriptions.attributes',
                maxChoices: 3
            },
            [levelChoices.hitPointSlots.name]: {
                description: 'DAGGERHEART.APPLICATIONS.Levelup.choiceDescriptions.hitPointSlots',
                maxChoices: 2
            },
            [levelChoices.stressSlots.name]: {
                description: 'DAGGERHEART.APPLICATIONS.Levelup.choiceDescriptions.stressSlots',
                maxChoices: 2
            },
            [levelChoices.experiences.name]: {
                description: 'DAGGERHEART.APPLICATIONS.Levelup.choiceDescriptions.experiences',
                maxChoices: 1
            },
            [levelChoices.proficiency.name]: {
                description: 'DAGGERHEART.APPLICATIONS.Levelup.choiceDescriptions.proficiency',
                maxChoices: 2
            },
            [levelChoices.armorOrEvasionSlot.name]: {
                description: 'DAGGERHEART.APPLICATIONS.Levelup.choiceDescriptions.armorOrEvasionSlot',
                maxChoices: 2
            },
            [levelChoices.majorDamageThreshold2.name]: {
                description: 'DAGGERHEART.APPLICATIONS.Levelup.choiceDescriptions.majorDamageThreshold2',
                maxChoices: 1
            },
            [levelChoices.severeDamageThreshold4.name]: {
                description: 'DAGGERHEART.APPLICATIONS.Levelup.choiceDescriptions.severeDamageThreshold4',
                maxChoices: 1
            },
            [levelChoices.subclass.name]: {
                description: 'DAGGERHEART.APPLICATIONS.Levelup.choiceDescriptions.subclass',
                maxChoices: 1
            },
            [levelChoices.multiclass.name]: {
                description: 'DAGGERHEART.APPLICATIONS.Levelup.choiceDescriptions.multiclass',
                maxChoices: 1,
                cost: 2
            }
        }
    }
};

export const subclassFeatureLabels = {
    1: 'DAGGERHEART.ITEMS.DomainCard.foundationTitle',
    2: 'DAGGERHEART.ITEMS.DomainCard.specializationTitle',
    3: 'DAGGERHEART.ITEMS.DomainCard.masteryTitle'
};

/**
 * @typedef {Object} TierData
 * @property {number} difficulty
 * @property {number} majorThreshold
 * @property {number} severeThreshold
 * @property {number} hp
 * @property {number} stress
 * @property {number} attack
 * @property {number[]} damage
 */

/** 
 * @type {Record<string, Record<2 | 3 | 4, TierData>} 
 * Scaling data used to change an adversary's tier. Each rank is applied incrementally.
 */
export const adversaryScalingData = {
    bruiser: {
        2: {
            difficulty: 2,
            majorThreshold: 5,
            severeThreshold: 10,
            hp: 1,
            stress: 2,
            attack: 2,
        },
        3: {
            difficulty: 2,
            majorThreshold: 7,
            severeThreshold: 15,
            hp: 1,
            stress: 0,
            attack: 2,
        },
        4: {
            difficulty: 2,
            majorThreshold: 12,
            severeThreshold: 25,
            hp: 1,
            stress: 0,
            attack: 2,
        }
    },
    horde: {
        2: {
            difficulty: 2,
            majorThreshold: 5,
            severeThreshold: 8,
            hp: 2,
            stress: 0,
            attack: 0,
        },
        3: {
            difficulty: 2,
            majorThreshold: 5,
            severeThreshold: 12,
            hp: 0,
            stress: 1,
            attack: 1,
        },
        4: {
            difficulty: 2,
            majorThreshold: 10,
            severeThreshold: 15,
            hp: 2,
            stress: 0,
            attack: 0,
        }
    },
    leader: {
        2: {
            difficulty: 2,
            majorThreshold: 6,
            severeThreshold: 10,
            hp: 0,
            stress: 0,
            attack: 1,
        },
        3: {
            difficulty: 2,
            majorThreshold: 6,
            severeThreshold: 15,
            hp: 1,
            stress: 0,
            attack: 2,
        },
        4: {
            difficulty: 2,
            majorThreshold: 12,
            severeThreshold: 25,
            hp: 1,
            stress: 1,
            attack: 3,
        }
    },
    minion: {
        2: {
            difficulty: 2,
            majorThreshold: 0,
            severeThreshold: 0,
            hp: 0,
            stress: 0,
            attack: 1,
        },
        3: {
            difficulty: 2,
            majorThreshold: 0,
            severeThreshold: 0,
            hp: 0,
            stress: 1,
            attack: 1,
        },
        4: {
            difficulty: 2,
            majorThreshold: 0,
            severeThreshold: 0,
            hp: 0,
            stress: 0,
            attack: 1,
        }
    },
    ranged: {
        2: {
            difficulty: 2,
            majorThreshold: 3,
            severeThreshold: 6,
            hp: 1,
            stress: 0,
            attack: 1,
        },
        3: {
            difficulty: 2,
            majorThreshold: 7,
            severeThreshold: 14,
            hp: 1,
            stress: 1,
            attack: 2,
        },
        4: {
            difficulty: 2,
            majorThreshold: 5,
            severeThreshold: 10,
            hp: 1,
            stress: 1,
            attack: 1,
        }
    },
    skulk: {
        2: {
            difficulty: 2,
            majorThreshold: 3,
            severeThreshold: 8,
            hp: 1,
            stress: 1,
            attack: 1,
        },
        3: {
            difficulty: 2,
            majorThreshold: 8,
            severeThreshold: 12,
            hp: 1,
            stress: 1,
            attack: 1,
        },
        4: {
            difficulty: 2,
            majorThreshold: 8,
            severeThreshold: 10,
            hp: 1,
            stress: 1,
            attack: 1,
        }
    },
    solo: {
        2: {
            difficulty: 2,
            majorThreshold: 5,
            severeThreshold: 10,
            hp: 0,
            stress: 1,
            attack: 2,
        },
        3: {
            difficulty: 2,
            majorThreshold: 7,
            severeThreshold: 15,
            hp: 2,
            stress: 1,
            attack: 2,
        },
        4: {
            difficulty: 2,
            majorThreshold: 12,
            severeThreshold: 25,
            hp: 0,
            stress: 1,
            attack: 3,
        }
    },
    standard: {
        2: {
            difficulty: 2,
            majorThreshold: 3,
            severeThreshold: 8,
            hp: 0,
            stress: 0,
            attack: 1,
        },
        3: {
            difficulty: 2,
            majorThreshold: 7,
            severeThreshold: 15,
            hp: 1,
            stress: 1,
            attack: 1,
        },
        4: {
            difficulty: 2,
            majorThreshold: 10,
            severeThreshold: 15,
            hp: 0,
            stress: 1,
            attack: 1,
        }
    },
    support: {
        2: {
            difficulty: 2,
            majorThreshold: 3,
            severeThreshold: 8,
            hp: 1,
            stress: 1,
            attack: 1,
        },
        3: {
            difficulty: 2,
            majorThreshold: 7,
            severeThreshold: 12,
            hp: 0,
            stress: 0,
            attack: 1,
        },
        4: {
            difficulty: 2,
            majorThreshold: 8,
            severeThreshold: 10,
            hp: 1,
            stress: 1,
            attack: 1,
        }
    }
};

/** 
 * Scaling data used for an adversary's damage.
 * Tier 4 is missing certain adversary types and therefore skews upwards.
 * We manually set tier 4 data to hopefully lead to better results
 */
export const adversaryExpectedDamage = {
  basic: {
    1: { mean: 7.321428571428571, deviation: 1.962519002770912 },
    2: { mean: 12.444444444444445, deviation: 2.0631069425529676 },
    3: { mean: 15.722222222222221, deviation: 2.486565208464823 },
    4: { mean: 26, deviation: 5.2 }
  },
  minion: {
    1: { mean: 2.142857142857143, deviation: 1.0690449676496976 },
    2: { mean: 5, deviation: 0.816496580927726 },
    3: { mean: 6.5, deviation: 2.1213203435596424 },
    4: { mean: 11, deviation: 1 }
  }
};
