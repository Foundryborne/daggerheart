export const abilities = {
    agility: {
        label: 'DAGGERHEART.CONFIG.Traits.agility.name',
        verbs: [
            'DAGGERHEART.CONFIG.Traits.agility.verb.sprint',
            'DAGGERHEART.CONFIG.Traits.agility.verb.leap',
            'DAGGERHEART.CONFIG.Traits.agility.verb.maneuver'
        ]
    },
    strength: {
        label: 'DAGGERHEART.CONFIG.Traits.strength.name',
        verbs: [
            'DAGGERHEART.CONFIG.Traits.strength.verb.lift',
            'DAGGERHEART.CONFIG.Traits.strength.verb.smash',
            'DAGGERHEART.CONFIG.Traits.strength.verb.grapple'
        ]
    },
    finesse: {
        label: 'DAGGERHEART.CONFIG.Traits.finesse.name',
        verbs: [
            'DAGGERHEART.CONFIG.Traits.finesse.verb.control',
            'DAGGERHEART.CONFIG.Traits.finesse.verb.hide',
            'DAGGERHEART.CONFIG.Traits.finesse.verb.tinker'
        ]
    },
    instinct: {
        label: 'DAGGERHEART.CONFIG.Traits.instinct.name',
        verbs: [
            'DAGGERHEART.CONFIG.Traits.instinct.verb.perceive',
            'DAGGERHEART.CONFIG.Traits.instinct.verb.sense',
            'DAGGERHEART.CONFIG.Traits.instinct.verb.navigate'
        ]
    },
    presence: {
        label: 'DAGGERHEART.CONFIG.Traits.presence.name',
        verbs: [
            'DAGGERHEART.CONFIG.Traits.presence.verb.charm',
            'DAGGERHEART.CONFIG.Traits.presence.verb.perform',
            'DAGGERHEART.CONFIG.Traits.presence.verb.deceive'
        ]
    },
    knowledge: {
        label: 'DAGGERHEART.CONFIG.Traits.knowledge.name',
        verbs: [
            'DAGGERHEART.CONFIG.Traits.knowledge.verb.recall',
            'DAGGERHEART.CONFIG.Traits.knowledge.verb.analyze',
            'DAGGERHEART.CONFIG.Traits.knowledge.verb.comprehend'
        ]
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
        description: 'DAGGERHEART.ACTORS.Adversary.bruiser.description'
    },
    horde: {
        id: 'horde',
        label: 'DAGGERHEART.CONFIG.AdversaryType.horde.label',
        description: 'DAGGERHEART.ACTORS.Adversary.horde.description'
    },
    leader: {
        id: 'leader',
        label: 'DAGGERHEART.CONFIG.AdversaryType.leader.label',
        description: 'DAGGERHEART.ACTORS.Adversary.leader.description'
    },
    minion: {
        id: 'minion',
        label: 'DAGGERHEART.CONFIG.AdversaryType.minion.label',
        description: 'DAGGERHEART.ACTORS.Adversary.minion.description'
    },
    ranged: {
        id: 'ranged',
        label: 'DAGGERHEART.CONFIG.AdversaryType.ranged.label',
        description: 'DAGGERHEART.ACTORS.Adversary.ranged.description'
    },
    skulk: {
        id: 'skulk',
        label: 'DAGGERHEART.CONFIG.AdversaryType.skulk.label',
        description: 'DAGGERHEART.ACTORS.Adversary.skulk.description'
    },
    social: {
        id: 'social',
        label: 'DAGGERHEART.CONFIG.AdversaryType.social.label',
        description: 'DAGGERHEART.ACTORS.Adversary.social.description'
    },
    solo: {
        id: 'solo',
        label: 'DAGGERHEART.CONFIG.AdversaryType.solo.label',
        description: 'DAGGERHEART.ACTORS.Adversary.solo.description'
    },
    standard: {
        id: 'standard',
        label: 'DAGGERHEART.CONFIG.AdversaryType.standard.label',
        description: 'DAGGERHEART.ACTORS.Adversary.standard.description'
    },
    support: {
        id: 'support',
        label: 'DAGGERHEART.CONFIG.AdversaryType.support.label',
        description: 'DAGGERHEART.ACTORS.Adversary.support.description'
    }
};

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
    1: 'DAGGERHEART.ITEMS.DomainCard.foundation',
    2: 'DAGGERHEART.ITEMS.DomainCard.specializationTitle',
    3: 'DAGGERHEART.ITEMS.DomainCard.masteryTitle'
};
