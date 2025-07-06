export const abilities = {
    agility: {
        label: 'DAGGERHEART.Config.Traits.agility.name',
        verbs: [
            'DAGGERHEART.Config.Traits.agility.verb.sprint',
            'DAGGERHEART.Config.Traits.agility.verb.leap',
            'DAGGERHEART.Config.Traits.agility.verb.maneuver'
        ]
    },
    strength: {
        label: 'DAGGERHEART.Config.Traits.strength.name',
        verbs: [
            'DAGGERHEART.Config.Traits.strength.verb.lift',
            'DAGGERHEART.Config.Traits.strength.verb.smash',
            'DAGGERHEART.Config.Traits.strength.verb.grapple'
        ]
    },
    finesse: {
        label: 'DAGGERHEART.Config.Traits.finesse.name',
        verbs: [
            'DAGGERHEART.Config.Traits.finesse.verb.control',
            'DAGGERHEART.Config.Traits.finesse.verb.hide',
            'DAGGERHEART.Config.Traits.finesse.verb.tinker'
        ]
    },
    instinct: {
        label: 'DAGGERHEART.Config.Traits.instinct.name',
        verbs: [
            'DAGGERHEART.Config.Traits.instinct.verb.perceive',
            'DAGGERHEART.Config.Traits.instinct.verb.sense',
            'DAGGERHEART.Config.Traits.instinct.verb.navigate'
        ]
    },
    presence: {
        label: 'DAGGERHEART.Config.Traits.presence.name',
        verbs: [
            'DAGGERHEART.Config.Traits.presence.verb.charm',
            'DAGGERHEART.Config.Traits.presence.verb.perform',
            'DAGGERHEART.Config.Traits.presence.verb.deceive'
        ]
    },
    knowledge: {
        label: 'DAGGERHEART.Config.Traits.knowledge.name',
        verbs: [
            'DAGGERHEART.Config.Traits.knowledge.verb.recall',
            'DAGGERHEART.Config.Traits.knowledge.verb.analyze',
            'DAGGERHEART.Config.Traits.knowledge.verb.comprehend'
        ]
    }
};

export const featureProperties = {
    agility: {
        name: 'DAGGERHEART.Config.Traits.agility.name',
        path: actor => actor.system.traits.agility.data.value
    },
    strength: {
        name: 'DAGGERHEART.Config.Traits.strength.name',
        path: actor => actor.system.traits.strength.data.value
    },
    finesse: {
        name: 'DAGGERHEART.Config.Traits.finesse.name',
        path: actor => actor.system.traits.finesse.data.value
    },
    instinct: {
        name: 'DAGGERHEART.Config.Traits.instinct.name',
        path: actor => actor.system.traits.instinct.data.value
    },
    presence: {
        name: 'DAGGERHEART.Config.Traits.presence.name',
        path: actor => actor.system.traits.presence.data.value
    },
    knowledge: {
        name: 'DAGGERHEART.Config.Traits.knowledge.name',
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
        label: 'DAGGERHEART.Config.AdversaryType.bruiser.label',
        description: 'DAGGERHEART.Actors.Adversary.bruiser.description'
    },
    horde: {
        id: 'horde',
        label: 'DAGGERHEART.Config.AdversaryType.horde.label',
        description: 'DAGGERHEART.Actors.Adversary.horde.description'
    },
    leader: {
        id: 'leader',
        label: 'DAGGERHEART.Config.AdversaryType.leader.label',
        description: 'DAGGERHEART.Actors.Adversary.leader.description'
    },
    minion: {
        id: 'minion',
        label: 'DAGGERHEART.Config.AdversaryType.minion.label',
        description: 'DAGGERHEART.Actors.Adversary.minion.description'
    },
    ranged: {
        id: 'ranged',
        label: 'DAGGERHEART.Config.AdversaryType.ranged.label',
        description: 'DAGGERHEART.Actors.Adversary.ranged.description'
    },
    skulk: {
        id: 'skulk',
        label: 'DAGGERHEART.Config.AdversaryType.skulk.label',
        description: 'DAGGERHEART.Actors.Adversary.skulk.description'
    },
    social: {
        id: 'social',
        label: 'DAGGERHEART.Config.AdversaryTypee.social.label',
        description: 'DAGGERHEART.Actors.Adversary.social.description'
    },
    solo: {
        id: 'solo',
        label: 'DAGGERHEART.Config.AdversaryType.solo.label',
        description: 'DAGGERHEART.Actors.Adversary.solo.description'
    },
    standard: {
        id: 'standard',
        label: 'DAGGERHEART.Config.AdversaryType.standard.label',
        description: 'DAGGERHEART.Actors.Adversary.standard.description'
    },
    support: {
        id: 'support',
        label: 'DAGGERHEART.Config.AdversaryType.support.label',
        description: 'DAGGERHEART.Actors.Adversary.support.description'
    }
};

export const environmentTypes = {
    exploration: {
        label: 'Daggerheart.Config.EnvironmentType.exploration.label',
        description: 'Daggerheart.Config.EnvironmentType.exploration.description'
    },
    social: {
        label: 'Daggerheart.Config.EnvironmentType.social.label',
        description: 'Daggerheart.Config.EnvironmentType.social.description'
    },
    traversal: {
        label: 'Daggerheart.Config.EnvironmentType.traversal.label',
        description: 'Daggerheart.Config.EnvironmentType.traversal.description'
    },
    event: {
        label: 'Daggerheart.Config.EnvironmentType.event.label',
        description: 'Daggerheart.Config.EnvironmentType.event.description'
    }
};

export const adversaryTraits = {
    relentless: {
        name: 'DAGGERHEART.Config.AdversaryTrait.relentless.name',
        description: 'DAGGERHEART.Config.AdversaryTrait.relentless.description',
        tip: 'DAGGERHEART.Config.AdversaryTrait.relentless.tip'
    },
    slow: {
        name: 'DAGGERHEART.Config.AdversaryTrait.slow.name',
        description: 'DAGGERHEART.Config.AdversaryTrait.slow.description',
        tip: 'DAGGERHEART.Config.AdversaryTrait.slow.tip'
    },
    minion: {
        name: 'DAGGERHEART.Config.AdversaryTrait.slow.name',
        description: 'DAGGERHEART.Config.AdversaryTrait.slow.description',
        tip: 'DAGGERHEART.Config.AdversaryTrait.slow.tip'
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
        label: 'DAGGERHEART.Applications.Levelup.tier1.Label',
        info: 'DAGGERHEART.Applications.Levelup.tier1.InfoLabel',
        pretext: 'DAGGERHEART.Applications.Levelup.tier1.Pretext',
        posttext: 'DAGGERHEART.Applications.Levelup.tier1.Posttext',
        choices: {
            [levelChoices.attributes.name]: {
                description: 'DAGGERHEART.Applications.Levelup.choiceDescriptions.attributes',
                maxChoices: 3
            },
            [levelChoices.hitPointSlots.name]: {
                description: 'DAGGERHEART.Applications.Levelup.choiceDescriptions.hitPointSlots',
                maxChoices: 1
            },
            [levelChoices.stressSlots.name]: {
                description: 'DAGGERHEART.Applications.Levelup.choiceDescriptions.stressSlots',
                maxChoices: 1
            },
            [levelChoices.experiences.name]: {
                description: 'DAGGERHEART.Applications.Levelup.choiceDescriptions.experiences',
                maxChoices: 1
            },
            [levelChoices.proficiency.name]: {
                description: 'DAGGERHEART.Applications.Levelup.choiceDescriptions.proficiency',
                maxChoices: 1
            },
            [levelChoices.armorOrEvasionSlot.name]: {
                description: 'DAGGERHEART.Applications.Levelup.choiceDescriptions.armorOrEvasionSlot',
                maxChoices: 1
            },
            [levelChoices.majorDamageThreshold2.name]: {
                description: 'DAGGERHEART.Applications.Levelup.choiceDescriptions.majorDamageThreshold2',
                maxChoices: 1
            },
            [levelChoices.severeDamageThreshold2.name]: {
                description: 'DAGGERHEART.Applications.Levelup.choiceDescriptions.severeDamageThreshold2',
                maxChoices: 1
            }
        }
    },
    tier2: {
        id: '5_7',
        tier: 2,
        levels: [5, 6, 7],
        label: 'DAGGERHEART.Applications.Levelup.tier2.Label',
        info: 'DAGGERHEART.Applications.Levelup.tier2.InfoLabel',
        pretext: 'DAGGERHEART.Applications.Levelup.tier2.Pretext',
        posttext: 'DAGGERHEART.Applications.Levelup.tier2.Posttext',
        choices: {
            [levelChoices.attributes.name]: {
                description: 'DAGGERHEART.Applications.Levelup.choiceDescriptions.attributes',
                maxChoices: 3
            },
            [levelChoices.hitPointSlots.name]: {
                description: 'DAGGERHEART.Applications.Levelup.choiceDescriptions.hitPointSlots',
                maxChoices: 2
            },
            [levelChoices.stressSlots.name]: {
                description: 'DAGGERHEART.Applications.Levelup.choiceDescriptions.stressSlots',
                maxChoices: 2
            },
            [levelChoices.experiences.name]: {
                description: 'DAGGERHEART.Applications.Levelup.choiceDescriptions.experiences',
                maxChoices: 1
            },
            [levelChoices.proficiency.name]: {
                description: 'DAGGERHEART.Applications.Levelup.choiceDescriptions.proficiency',
                maxChoices: 2
            },
            [levelChoices.armorOrEvasionSlot.name]: {
                description: 'DAGGERHEART.Applications.Levelup.choiceDescriptions.armorOrEvasionSlot',
                maxChoices: 2
            },
            [levelChoices.majorDamageThreshold2.name]: {
                description: 'DAGGERHEART.Applications.Levelup.choiceDescriptions.majorDamageThreshold2',
                maxChoices: 1
            },
            [levelChoices.severeDamageThreshold3.name]: {
                description: 'DAGGERHEART.Applications.Levelup.choiceDescriptions.severeDamageThreshold3',
                maxChoices: 1
            },
            [levelChoices.subclass.name]: {
                description: 'DAGGERHEART.Applications.Levelup.choiceDescriptions.subclass',
                maxChoices: 1
            },
            [levelChoices.multiclass.name]: {
                description: 'DAGGERHEART.Applications.Levelup.choiceDescriptions.multiclass',
                maxChoices: 1,
                cost: 2
            }
        }
    },
    tier3: {
        id: '8_10',
        tier: 3,
        levels: [8, 9, 10],
        label: 'DAGGERHEART.Applications.Levelup.tier3.Label',
        info: 'DAGGERHEART.Applications.Levelup.tier3.InfoLabel',
        pretext: 'DAGGERHEART.Applications.Levelup.tier3.Pretext',
        posttext: 'DAGGERHEART.Applications.Levelup.tier3.Posttext',
        choices: {
            [levelChoices.attributes.name]: {
                description: 'DAGGERHEART.Applications.Levelup.choiceDescriptions.attributes',
                maxChoices: 3
            },
            [levelChoices.hitPointSlots.name]: {
                description: 'DAGGERHEART.Applications.Levelup.choiceDescriptions.hitPointSlots',
                maxChoices: 2
            },
            [levelChoices.stressSlots.name]: {
                description: 'DAGGERHEART.Applications.Levelup.choiceDescriptions.stressSlots',
                maxChoices: 2
            },
            [levelChoices.experiences.name]: {
                description: 'DAGGERHEART.Applications.Levelup.choiceDescriptions.experiences',
                maxChoices: 1
            },
            [levelChoices.proficiency.name]: {
                description: 'DAGGERHEART.Applications.Levelup.choiceDescriptions.proficiency',
                maxChoices: 2
            },
            [levelChoices.armorOrEvasionSlot.name]: {
                description: 'DAGGERHEART.Applications.Levelup.choiceDescriptions.armorOrEvasionSlot',
                maxChoices: 2
            },
            [levelChoices.majorDamageThreshold2.name]: {
                description: 'DAGGERHEART.Applications.Levelup.choiceDescriptions.majorDamageThreshold2',
                maxChoices: 1
            },
            [levelChoices.severeDamageThreshold4.name]: {
                description: 'DAGGERHEART.Applications.Levelup.choiceDescriptions.severeDamageThreshold4',
                maxChoices: 1
            },
            [levelChoices.subclass.name]: {
                description: 'DAGGERHEART.Applications.Levelup.choiceDescriptions.subclass',
                maxChoices: 1
            },
            [levelChoices.multiclass.name]: {
                description: 'DAGGERHEART.Applications.Levelup.choiceDescriptions.multiclass',
                maxChoices: 1,
                cost: 2
            }
        }
    }
};

export const subclassFeatureLabels = {
    1: 'DAGGERHEART.Items.DomainCard.foundation',
    2: 'DAGGERHEART.Items.DomainCard.specializationTitle',
    3: 'DAGGERHEART.Items.DomainCard.masteryTitle'
};
