export class DhLevelTiers extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            tiers: new fields.TypedObjectField(new fields.EmbeddedDataField(DhLevelTier))
        };
    }

    get availableChoicesPerLevel() {
        return Object.values(this.tiers).reduce((acc, tier) => {
            for (var level = tier.levels.start; level < tier.levels.end + 1; level++) {
                acc[level] = tier.availableOptions;
            }

            return acc;
        }, {});
    }
}

class DhLevelTier extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            tier: new fields.NumberField({ required: true, integer: true }),
            name: new fields.StringField({ required: true }),
            levels: new fields.SchemaField({
                start: new fields.NumberField({ required: true, integer: true }),
                end: new fields.NumberField({ required: true, integer: true })
            }),
            initialAchievements: new fields.SchemaField({
                experience: new fields.SchemaField({
                    nr: new fields.NumberField({ required: true, initial: 1 }),
                    modifier: new fields.NumberField({ required: true, initial: 2 })
                }),
                proficiency: new fields.NumberField({ integer: true, initial: 1 })
            }),
            availableOptions: new fields.NumberField({ required: true, initial: 2 }),
            domainCardByLevel: new fields.NumberField({ initial: 1 }),
            options: new fields.TypedObjectField(new fields.EmbeddedDataField(DhLevelOption))
        };
    }
}

class DhLevelOption extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            label: new fields.StringField({ required: true }),
            checkboxSelections: new fields.NumberField({ required: true, integer: true, initial: 1 }),
            minCost: new fields.NumberField({ required: true, integer: true, initial: 1 }),
            type: new fields.StringField({ required: true, choices: LevelOptionType }),
            value: new fields.NumberField({ integer: true }),
            amount: new fields.NumberField({ integer: true })
        };
    }
}

export const CompanionLevelOptionType = {
    hope: {
        id: 'hope',
        label: 'Light In The Dark'
    },
    creatureComfort: {
        id: 'creatureComfort',
        label: 'Creature Comfort',
        features: [
            {
                name: 'DAGGERHEART.LevelUp.Actions.CreatureComfort.Name',
                img: 'icons/magic/life/heart-cross-purple-orange.webp',
                description: 'DAGGERHEART.LevelUp.Actions.CreatureComfort.Description'
            }
        ]
    },
    armored: {
        id: 'armored',
        label: 'Armored',
        features: [
            {
                name: 'DAGGERHEART.LevelUp.Actions.Armored.Name',
                img: 'icons/equipment/shield/kite-wooden-oak-glow.webp',
                description: 'DAGGERHEART.LevelUp.Actions.Armored.Description'
            }
        ]
    },
    vicious: {
        id: 'vicious',
        label: 'Viscious'
    },
    resilient: {
        id: 'resilient',
        label: 'Resilient'
    },
    bonded: {
        id: 'bonded',
        label: 'Bonded',
        features: [
            {
                name: 'DAGGERHEART.LevelUp.Actions.Bonded.Name',
                img: 'icons/magic/life/heart-red-blue.webp',
                description: 'DAGGERHEART.LevelUp.Actions.Bonded.Description'
            }
        ]
    },
    aware: {
        id: 'aware',
        label: 'Aware'
    }
};

export const LevelOptionType = {
    trait: {
        id: 'trait',
        label: 'Character Trait',
        dataPath: ''
    },
    hitPoint: {
        id: 'hitPoint',
        label: 'Hit Points',
        dataPath: 'resources.hitPoints',
        dataPathData: {
            property: 'max',
            dependencies: ['value']
        }
    },
    stress: {
        id: 'stress',
        label: 'Stress',
        dataPath: 'resources.stress',
        dataPathData: {
            property: 'max',
            dependencies: ['value']
        }
    },
    evasion: {
        id: 'evasion',
        label: 'Evasion',
        dataPath: 'evasion'
    },
    proficiency: {
        id: 'proficiency',
        label: 'Proficiency'
    },
    experience: {
        id: 'experience',
        label: 'Experience'
    },
    domainCard: {
        id: 'domainCard',
        label: 'Domain Card'
    },
    subclass: {
        id: 'subclass',
        label: 'Subclass'
    },
    multiclass: {
        id: 'multiclass',
        label: 'Multiclass'
    },
    ...CompanionLevelOptionType
};

export const defaultLevelTiers = {
    tiers: {
        2: {
            tier: 2,
            name: 'Tier 2',
            levels: {
                start: 2,
                end: 4
            },
            initialAchievements: {
                experience: {
                    nr: 1,
                    modifier: 2
                },
                proficiency: 1
            },
            availableOptions: 2,
            domainCardByLevel: 1,
            options: {
                trait: {
                    label: 'DAGGERHEART.LevelUp.Options.trait',
                    checkboxSelections: 3,
                    minCost: 1,
                    type: LevelOptionType.trait.id,
                    amount: 2
                },
                hitPoint: {
                    label: 'DAGGERHEART.LevelUp.Options.hitPoint',
                    checkboxSelections: 2,
                    minCost: 1,
                    type: LevelOptionType.hitPoint.id,
                    value: 1,
                    value: 1
                },
                stress: {
                    label: 'DAGGERHEART.LevelUp.Options.stress',
                    checkboxSelections: 2,
                    minCost: 1,
                    type: LevelOptionType.stress.id,
                    value: 1
                },
                experience: {
                    label: 'DAGGERHEART.LevelUp.Options.experience',
                    checkboxSelections: 1,
                    minCost: 1,
                    type: LevelOptionType.experience.id,
                    value: 1,
                    amount: 2
                },
                domainCard: {
                    label: 'DAGGERHEART.LevelUp.Options.domainCard',
                    checkboxSelections: 1,
                    minCost: 1,
                    type: LevelOptionType.domainCard.id,
                    amount: 1
                },
                evasion: {
                    label: 'DAGGERHEART.LevelUp.Options.evasion',
                    checkboxSelections: 1,
                    minCost: 1,
                    type: LevelOptionType.evasion.id,
                    value: 1
                }
            }
        },
        3: {
            tier: 3,
            name: 'Tier 3',
            levels: {
                start: 5,
                end: 7
            },
            initialAchievements: {
                experience: {
                    nr: 1,
                    modifier: 2
                },
                proficiency: 1
            },
            availableOptions: 2,
            domainCardByLevel: 1,
            options: {
                trait: {
                    label: 'DAGGERHEART.LevelUp.Options.trait',
                    checkboxSelections: 3,
                    minCost: 1,
                    type: LevelOptionType.trait.id,
                    amount: 2
                },
                hitPoint: {
                    label: 'DAGGERHEART.LevelUp.Options.hitPoint',
                    checkboxSelections: 2,
                    minCost: 1,
                    type: LevelOptionType.hitPoint.id,
                    value: 1
                },
                stress: {
                    label: 'DAGGERHEART.LevelUp.Options.stress',
                    checkboxSelections: 2,
                    minCost: 1,
                    type: LevelOptionType.stress.id,
                    value: 1
                },
                experience: {
                    label: 'DAGGERHEART.LevelUp.Options.experience',
                    checkboxSelections: 1,
                    minCost: 1,
                    type: LevelOptionType.experience.id,
                    value: 1,
                    amount: 2
                },
                domainCard: {
                    label: 'DAGGERHEART.LevelUp.Options.domainCard',
                    checkboxSelections: 1,
                    minCost: 1,
                    type: LevelOptionType.domainCard.id,
                    amount: 1
                },
                evasion: {
                    label: 'DAGGERHEART.LevelUp.Options.evasion',
                    checkboxSelections: 1,
                    minCost: 1,
                    type: LevelOptionType.evasion.id,
                    value: 1
                },
                subclass: {
                    label: 'DAGGERHEART.LevelUp.Options.subclass',
                    checkboxSelections: 1,
                    minCost: 1,
                    type: LevelOptionType.subclass.id
                },
                proficiency: {
                    label: 'DAGGERHEART.LevelUp.Options.proficiency',
                    checkboxSelections: 2,
                    minCost: 2,
                    type: LevelOptionType.proficiency.id,
                    value: 1
                },
                multiclass: {
                    label: 'DAGGERHEART.LevelUp.Options.multiclass',
                    checkboxSelections: 2,
                    minCost: 2,
                    type: LevelOptionType.multiclass.id
                }
            }
        },
        4: {
            tier: 4,
            name: 'Tier 4',
            levels: {
                start: 8,
                end: 10
            },
            initialAchievements: {
                experience: {
                    nr: 1,
                    modifier: 2
                },
                proficiency: 1
            },
            availableOptions: 2,
            domainCardByLevel: 1,
            options: {
                trait: {
                    label: 'DAGGERHEART.LevelUp.Options.trait',
                    checkboxSelections: 3,
                    minCost: 1,
                    type: LevelOptionType.trait.id,
                    amount: 2
                },
                hitPoint: {
                    label: 'DAGGERHEART.LevelUp.Options.hitPoint',
                    checkboxSelections: 2,
                    minCost: 1,
                    type: LevelOptionType.hitPoint.id,
                    value: 1
                },
                stress: {
                    label: 'DAGGERHEART.LevelUp.Options.stress',
                    checkboxSelections: 2,
                    minCost: 1,
                    type: LevelOptionType.stress.id,
                    value: 1
                },
                experience: {
                    label: 'DAGGERHEART.LevelUp.Options.experience',
                    checkboxSelections: 1,
                    minCost: 1,
                    type: LevelOptionType.experience.id,
                    value: 1,
                    amount: 2
                },
                domainCard: {
                    label: 'DAGGERHEART.LevelUp.Options.domainCard',
                    checkboxSelections: 1,
                    minCost: 1,
                    type: LevelOptionType.domainCard.id,
                    amount: 1
                },
                evasion: {
                    label: 'DAGGERHEART.LevelUp.Options.evasion',
                    checkboxSelections: 1,
                    minCost: 1,
                    type: LevelOptionType.evasion.id,
                    value: 1
                },
                subclass: {
                    label: 'DAGGERHEART.LevelUp.Options.subclass',
                    checkboxSelections: 1,
                    minCost: 1,
                    type: LevelOptionType.subclass.id
                },
                proficiency: {
                    label: 'DAGGERHEART.LevelUp.Options.proficiency',
                    checkboxSelections: 2,
                    minCost: 2,
                    type: LevelOptionType.proficiency.id,
                    value: 1
                },
                multiclass: {
                    label: 'DAGGERHEART.LevelUp.Options.multiclass',
                    checkboxSelections: 2,
                    minCost: 2,
                    type: LevelOptionType.multiclass.id
                }
            }
        }
    }
};

export const defaultCompanionTier = {
    tiers: {
        2: {
            tier: 2,
            name: 'Companion Choices',
            levels: {
                start: 2,
                end: 10
            },
            initialAchievements: {},
            availableOptions: 1,
            domainCardByLevel: 0,
            options: {
                experience: {
                    label: 'DAGGERHEART.LevelUp.Options.intelligent',
                    checkboxSelections: 3,
                    minCost: 1,
                    type: LevelOptionType.experience.id,
                    value: 1,
                    amount: 1
                },
                hope: {
                    label: 'DAGGERHEART.LevelUp.Options.lightInTheDark',
                    checkboxSelections: 1,
                    minCost: 1,
                    type: CompanionLevelOptionType.hope.id,
                    value: 1
                },
                creatureComfort: {
                    label: 'DAGGERHEART.LevelUp.Options.creatureComfort',
                    checkboxSelections: 1,
                    minCost: 1,
                    type: CompanionLevelOptionType.creatureComfort.id,
                    value: 1
                },
                armored: {
                    label: 'DAGGERHEART.LevelUp.Options.armored',
                    checkboxSelections: 1,
                    minCost: 1,
                    type: CompanionLevelOptionType.armored.id,
                    value: 1
                },
                vicious: {
                    label: 'DAGGERHEART.LevelUp.Options.vicious',
                    checkboxSelections: 3,
                    minCost: 1,
                    type: CompanionLevelOptionType.vicious.id,
                    value: 1,
                    amount: 1
                },
                stress: {
                    label: 'DAGGERHEART.LevelUp.Options.resilient',
                    checkboxSelections: 3,
                    minCost: 1,
                    type: LevelOptionType.stress.id,
                    value: 1
                },
                bonded: {
                    label: 'DAGGERHEART.LevelUp.Options.bonded',
                    checkboxSelections: 1,
                    minCost: 1,
                    type: CompanionLevelOptionType.bonded.id,
                    value: 1
                },
                evasion: {
                    label: 'DAGGERHEART.LevelUp.Options.aware',
                    checkboxSelections: 3,
                    minCost: 1,
                    type: LevelOptionType.evasion.id,
                    value: 2,
                    amount: 1
                }
            }
        }
    }
};
