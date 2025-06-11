export const abilities = {
    agility: {
        label: 'DAGGERHEART.Abilities.agility.name',
        verbs: [
            'DAGGERHEART.Abilities.agility.verb.sprint',
            'DAGGERHEART.Abilities.agility.verb.leap',
            'DAGGERHEART.Abilities.agility.verb.maneuver'
        ]
    },
    strength: {
        label: 'DAGGERHEART.Abilities.strength.name',
        verbs: [
            'DAGGERHEART.Abilities.strength.verb.lift',
            'DAGGERHEART.Abilities.strength.verb.smash',
            'DAGGERHEART.Abilities.strength.verb.grapple'
        ]
    },
    finesse: {
        label: 'DAGGERHEART.Abilities.finesse.name',
        verbs: [
            'DAGGERHEART.Abilities.finesse.verb.control',
            'DAGGERHEART.Abilities.finesse.verb.hide',
            'DAGGERHEART.Abilities.finesse.verb.tinker'
        ]
    },
    instinct: {
        label: 'DAGGERHEART.Abilities.instinct.name',
        verbs: [
            'DAGGERHEART.Abilities.instinct.verb.perceive',
            'DAGGERHEART.Abilities.instinct.verb.sense',
            'DAGGERHEART.Abilities.instinct.verb.navigate'
        ]
    },
    presence: {
        label: 'DAGGERHEART.Abilities.presence.name',
        verbs: [
            'DAGGERHEART.Abilities.presence.verb.charm',
            'DAGGERHEART.Abilities.presence.verb.perform',
            'DAGGERHEART.Abilities.presence.verb.deceive'
        ]
    },
    knowledge: {
        label: 'DAGGERHEART.Abilities.knowledge.name',
        verbs: [
            'DAGGERHEART.Abilities.knowledge.verb.recall',
            'DAGGERHEART.Abilities.knowledge.verb.analyze',
            'DAGGERHEART.Abilities.knowledge.verb.comprehend'
        ]
    }
};

export const featureProperties = {
    agility: {
        name: 'DAGGERHEART.Abilities.agility.name',
        path: actor => actor.system.traits.agility.data.value
    },
    strength: {
        name: 'DAGGERHEART.Abilities.strength.name',
        path: actor => actor.system.traits.strength.data.value
    },
    finesse: {
        name: 'DAGGERHEART.Abilities.finesse.name',
        path: actor => actor.system.traits.finesse.data.value
    },
    instinct: {
        name: 'DAGGERHEART.Abilities.instinct.name',
        path: actor => actor.system.traits.instinct.data.value
    },
    presence: {
        name: 'DAGGERHEART.Abilities.presence.name',
        path: actor => actor.system.traits.presence.data.value
    },
    knowledge: {
        name: 'DAGGERHEART.Abilities.knowledge.name',
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
        label: 'DAGGERHEART.Adversary.Type.Bruiser.label',
        description: 'DAGGERHEART.Adversary.Bruiser.Description'
    },
    horde: {
        id: 'horde',
        label: 'DAGGERHEART.Adversary.Type.Horde.label',
        description: 'DAGGERHEART.Adversary.Horde.Description'
    },
    leader: {
        id: 'leader',
        label: 'DAGGERHEART.Adversary.Type.Leader.label',
        description: 'DAGGERHEART.Adversary.Leader.Description'
    },
    minion: {
        id: 'minion',
        label: 'DAGGERHEART.Adversary.Type.Minion.label',
        description: 'DAGGERHEART.Adversary.Minion.Description'
    },
    ranged: {
        id: 'ranged',
        label: 'DAGGERHEART.Adversary.Type.Ranged.label',
        description: 'DAGGERHEART.Adversary.Ranged.Description'
    },
    skulk: {
        id: 'skulk',
        label: 'DAGGERHEART.Adversary.Type.Skulk.label',
        description: 'DAGGERHEART.Adversary.Skulk.Description'
    },
    social: {
        id: 'social',
        label: 'DAGGERHEART.Adversary.Type.Social.label',
        description: 'DAGGERHEART.Adversary.Social.Description'
    },
    solo: {
        id: 'solo',
        label: 'DAGGERHEART.Adversary.Type.Solo.label',
        description: 'DAGGERHEART.Adversary.Solo.Description'
    },
    standard: {
        id: 'standard',
        label: 'DAGGERHEART.Adversary.Type.Standard.label',
        description: 'DAGGERHEART.Adversary.Standard.Description'
    },
    support: {
        id: 'support',
        label: 'DAGGERHEART.Adversary.Type.Support.label',
        description: 'DAGGERHEART.Adversary.Support.Description'
    }
};

export const environmentTypes = {
    exploration: {
        label: 'DAGGERHEART.Environment.Type.Exploration.label',
        description: 'DAGGERHEART.Environment.Type.Exploration.description'
    },
    social: {
        label: 'DAGGERHEART.Environment.Type.Social.label',
        description: 'DAGGERHEART.Environment.Type.Social.description'
    },
    traversal: {
        label: 'DAGGERHEART.Environment.Type.Traversal.label',
        description: 'DAGGERHEART.Environment.Type.Traversal.description'
    },
    event: {
        label: 'DAGGERHEART.Environment.Type.Event.label',
        description: 'DAGGERHEART.Environment.Type.Event.description'
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

export const subclassFeatureLabels = {
    1: 'DAGGERHEART.Sheets.PC.DomainCard.FoundationTitle',
    2: 'DAGGERHEART.Sheets.PC.DomainCard.SpecializationTitle',
    3: 'DAGGERHEART.Sheets.PC.DomainCard.MasteryTitle'
};
