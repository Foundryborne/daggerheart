export const abilities = {
    agility: {
        label: 'DAGGERHEART.Abilities.Agility.Name',
        verbs: [
            'DAGGERHEART.Abilities.Agility.Verb.Sprint',
            'DAGGERHEART.Abilities.Agility.Verb.Leap',
            'DAGGERHEART.Abilities.Agility.Verb.Maneuver'
        ]
    },
    strength: {
        label: 'DAGGERHEART.Abilities.Strength.Name',
        verbs: [
            'DAGGERHEART.Abilities.Strength.Verb.Lift',
            'DAGGERHEART.Abilities.Strength.Verb.Smash',
            'DAGGERHEART.Abilities.Strength.Verb.Grapple'
        ]
    },
    finesse: {
        label: 'DAGGERHEART.Abilities.Finesse.Name',
        verbs: [
            'DAGGERHEART.Abilities.Finesse.Verb.Control',
            'DAGGERHEART.Abilities.Finesse.Verb.Hide',
            'DAGGERHEART.Abilities.Finesse.Verb.Tinker'
        ]
    },
    instinct: {
        label: 'DAGGERHEART.Abilities.Instinct.Name',
        verbs: [
            'DAGGERHEART.Abilities.Instinct.Verb.Perceive',
            'DAGGERHEART.Abilities.Instinct.Verb.Sense',
            'DAGGERHEART.Abilities.Instinct.Verb.Navigate'
        ]
    },
    presence: {
        label: 'DAGGERHEART.Abilities.Presence.Name',
        verbs: [
            'DAGGERHEART.Abilities.Presence.Verb.Charm',
            'DAGGERHEART.Abilities.Presence.Verb.Perform',
            'DAGGERHEART.Abilities.Presence.Verb.Deceive'
        ]
    },
    knowledge: {
        label: 'DAGGERHEART.Abilities.Knowledge.Name',
        verbs: [
            'DAGGERHEART.Abilities.Knowledge.Verb.Recall',
            'DAGGERHEART.Abilities.Knowledge.Verb.Analyze',
            'DAGGERHEART.Abilities.Knowledge.Verb.Comprehend'
        ]
    }
};

export const featureProperties = {
    agility: {
        name: 'DAGGERHEART.Abilities.Agility.Name',
        path: actor => actor.system.attributes.agility.data.value
    },
    strength: {
        name: 'DAGGERHEART.Abilities.Strength.Name',
        path: actor => actor.system.attributes.strength.data.value
    },
    finesse: {
        name: 'DAGGERHEART.Abilities.Finesse.Name',
        path: actor => actor.system.attributes.finesse.data.value
    },
    instinct: {
        name: 'DAGGERHEART.Abilities.Instinct.Name',
        path: actor => actor.system.attributes.instinct.data.value
    },
    presence: {
        name: 'DAGGERHEART.Abilities.Presence.Name',
        path: actor => actor.system.attributes.presence.data.value
    },
    knowledge: {
        name: 'DAGGERHEART.Abilities.Knowledge.Name',
        path: actor => actor.system.attributes.knowledge.data.value
    },
    spellcastingTrait: {
        name: 'DAGGERHEART.FeatureProperty.SpellcastingTrait',
        path: actor => actor.system.attributes[actor.system.subclass.system.spellcastingTrait].data.value
    }
};

export const adversaryTypes = {
    bruiser: {
        name: 'DAGGERHEART.Adversary.Bruiser.Name',
        description: 'DAGGERHEART.Adversary.Bruiser.Description'
    },
    horde: {
        name: 'DAGGERHEART.Adversary.Horde.Name',
        description: 'DAGGERHEART.Adversary.Horde.Description'
    },
    leader: {
        name: 'DAGGERHEART.Adversary.Leader.Name',
        description: 'DAGGERHEART.Adversary.Leader.Description'
    },
    minion: {
        name: 'DAGGERHEART.Adversary.Minion.Name',
        description: 'DAGGERHEART.Adversary.Minion.Description'
    },
    ranged: {
        name: 'DAGGERHEART.Adversary.Ranged.Name',
        description: 'DAGGERHEART.Adversary.Ranged.Description'
    },
    skulker: {
        name: 'DAGGERHEART.Adversary.Skulker.Name',
        description: 'DAGGERHEART.Adversary.Skulker.Description'
    },
    social: {
        name: 'DAGGERHEART.Adversary.Social.Name',
        description: 'DAGGERHEART.Adversary.Social.Description'
    },
    solo: {
        name: 'DAGGERHEART.Adversary.Solo.Name',
        description: 'DAGGERHEART.Adversary.Solo.Description'
    },
    standard: {
        name: 'DAGGERHEART.Adversary.Standard.Name',
        description: 'DAGGERHEART.Adversary.Standard.Description'
    },
    support: {
        name: 'DAGGERHEART.Adversary.Support.Name',
        description: 'DAGGERHEART.Adversary.Support.Description'
    }
};

export const adversaryTraits = {
    relentless: {
        name: 'DAGGERHEART.Adversary.Trait..Name',
        description: 'DAGGERHEART.Adversary.Trait..Description',
        tip: 'DAGGERHEART.Adversary.Trait..Tip'
    },
    slow: {
        name: 'DAGGERHEART.Adversary.Trait..Name',
        description: 'DAGGERHEART.Adversary.Trait..Description',
        tip: 'DAGGERHEART.Adversary.Trait..Tip'
    },
    minion: {
        name: 'DAGGERHEART.Adversary.Trait..Name',
        description: 'DAGGERHEART.Adversary.Trait..Description',
        tip: 'DAGGERHEART.Adversary.Trait..Tip'
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
        label: 'DAGGERHEART.LevelUp.Tier1.Label',
        info: 'DAGGERHEART.LevelUp.Tier1.InfoLabel',
        pretext: 'DAGGERHEART.LevelUp.Tier1.Pretext',
        posttext: 'DAGGERHEART.LevelUp.Tier1.Posttext',
        choices: {
            [levelChoices.attributes.name]: {
                description: 'DAGGERHEART.LevelUp.ChoiceDescriptions.Attributes',
                maxChoices: 3
            },
            [levelChoices.hitPointSlots.name]: {
                description: 'DAGGERHEART.LevelUp.ChoiceDescriptions.HitPointSlots',
                maxChoices: 1
            },
            [levelChoices.stressSlots.name]: {
                description: 'DAGGERHEART.LevelUp.ChoiceDescriptions.StressSlots',
                maxChoices: 1
            },
            [levelChoices.experiences.name]: {
                description: 'DAGGERHEART.LevelUp.ChoiceDescriptions.Experiences',
                maxChoices: 1
            },
            [levelChoices.proficiency.name]: {
                description: 'DAGGERHEART.LevelUp.ChoiceDescriptions.Proficiency',
                maxChoices: 1
            },
            [levelChoices.armorOrEvasionSlot.name]: {
                description: 'DAGGERHEART.LevelUp.ChoiceDescriptions.ArmorOrEvasionSlot',
                maxChoices: 1
            },
            [levelChoices.majorDamageThreshold2.name]: {
                description: 'DAGGERHEART.LevelUp.ChoiceDescriptions.MajorDamageThreshold2',
                maxChoices: 1
            },
            [levelChoices.severeDamageThreshold2.name]: {
                description: 'DAGGERHEART.LevelUp.ChoiceDescriptions.SevereDamageThreshold2',
                maxChoices: 1
            }
        }
    },
    tier2: {
        id: '5_7',
        tier: 2,
        levels: [5, 6, 7],
        label: 'DAGGERHEART.LevelUp.Tier2.Label',
        info: 'DAGGERHEART.LevelUp.Tier2.InfoLabel',
        pretext: 'DAGGERHEART.LevelUp.Tier2.Pretext',
        posttext: 'DAGGERHEART.LevelUp.Tier2.Posttext',
        choices: {
            [levelChoices.attributes.name]: {
                description: 'DAGGERHEART.LevelUp.ChoiceDescriptions.Attributes',
                maxChoices: 3
            },
            [levelChoices.hitPointSlots.name]: {
                description: 'DAGGERHEART.LevelUp.ChoiceDescriptions.HitPointSlots',
                maxChoices: 2
            },
            [levelChoices.stressSlots.name]: {
                description: 'DAGGERHEART.LevelUp.ChoiceDescriptions.StressSlots',
                maxChoices: 2
            },
            [levelChoices.experiences.name]: {
                description: 'DAGGERHEART.LevelUp.ChoiceDescriptions.Experiences',
                maxChoices: 1
            },
            [levelChoices.proficiency.name]: {
                description: 'DAGGERHEART.LevelUp.ChoiceDescriptions.Proficiency',
                maxChoices: 2
            },
            [levelChoices.armorOrEvasionSlot.name]: {
                description: 'DAGGERHEART.LevelUp.ChoiceDescriptions.ArmorOrEvasionSlot',
                maxChoices: 2
            },
            [levelChoices.majorDamageThreshold2.name]: {
                description: 'DAGGERHEART.LevelUp.ChoiceDescriptions.MajorDamageThreshold2',
                maxChoices: 1
            },
            [levelChoices.severeDamageThreshold3.name]: {
                description: 'DAGGERHEART.LevelUp.ChoiceDescriptions.SevereDamageThreshold3',
                maxChoices: 1
            },
            [levelChoices.subclass.name]: {
                description: 'DAGGERHEART.LevelUp.ChoiceDescriptions.Subclass',
                maxChoices: 1
            },
            [levelChoices.multiclass.name]: {
                description: 'DAGGERHEART.LevelUp.ChoiceDescriptions.Multiclass',
                maxChoices: 1,
                cost: 2
            }
        }
    },
    tier3: {
        id: '8_10',
        tier: 3,
        levels: [8, 9, 10],
        label: 'DAGGERHEART.LevelUp.Tier3.Label',
        info: 'DAGGERHEART.LevelUp.Tier3.InfoLabel',
        pretext: 'DAGGERHEART.LevelUp.Tier3.Pretext',
        posttext: 'DAGGERHEART.LevelUp.Tier3.Posttext',
        choices: {
            [levelChoices.attributes.name]: {
                description: 'DAGGERHEART.LevelUp.ChoiceDescriptions.Attributes',
                maxChoices: 3
            },
            [levelChoices.hitPointSlots.name]: {
                description: 'DAGGERHEART.LevelUp.ChoiceDescriptions.HitPointSlots',
                maxChoices: 2
            },
            [levelChoices.stressSlots.name]: {
                description: 'DAGGERHEART.LevelUp.ChoiceDescriptions.StressSlots',
                maxChoices: 2
            },
            [levelChoices.experiences.name]: {
                description: 'DAGGERHEART.LevelUp.ChoiceDescriptions.Experiences',
                maxChoices: 1
            },
            [levelChoices.proficiency.name]: {
                description: 'DAGGERHEART.LevelUp.ChoiceDescriptions.Proficiency',
                maxChoices: 2
            },
            [levelChoices.armorOrEvasionSlot.name]: {
                description: 'DAGGERHEART.LevelUp.ChoiceDescriptions.ArmorOrEvasionSlot',
                maxChoices: 2
            },
            [levelChoices.majorDamageThreshold2.name]: {
                description: 'DAGGERHEART.LevelUp.ChoiceDescriptions.MajorDamageThreshold2',
                maxChoices: 1
            },
            [levelChoices.severeDamageThreshold4.name]: {
                description: 'DAGGERHEART.LevelUp.ChoiceDescriptions.SevereDamageThreshold4',
                maxChoices: 1
            },
            [levelChoices.subclass.name]: {
                description: 'DAGGERHEART.LevelUp.ChoiceDescriptions.Subclass',
                maxChoices: 1
            },
            [levelChoices.multiclass.name]: {
                description: 'DAGGERHEART.LevelUp.ChoiceDescriptions.Multiclass',
                maxChoices: 1,
                cost: 2
            }
        }
    }
};
