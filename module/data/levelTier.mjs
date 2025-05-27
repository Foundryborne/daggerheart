export class DhLevelTiers extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            tiers: new fields.TypedObjectField(new fields.EmbeddedDataField(DhLevelTier))
        };
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
            checkboxQuantity: new fields.NumberField({ required: true, integer: true, initial: 1 }),
            minCost: new fields.NumberField({ required: true, integer: true, initial: 1 }),
            type: new fields.StringField({ required: true, choices: LevelOptionType }),
            choice: new fields.StringField(),
            value: new fields.NumberField({ integer: true }),
            amount: new fields.NumberField({ integer: true })
        };
    }
}

// class DhLevelOptionType extends foundry.abstract.DataModel {
//     static defineSchema(){
//         return new fields.SchemaField({
//             trait: new fields.SchemaField({
//                 id: new fields.StringField({ required: true }),
//                 label: new fields.StringField({ required: true }),
//             }),
//             attribute: new fields.SchemaField({
//                 id: new fields.StringField({ required: true }),
//                 label: new fields.StringField({ required: true }),
//                 choice: new fields.StringField({ required: true, choices: attributeChoices })
//             }),
//             experience: new fields.SchemaField({
//                 id: new fields.StringField({ required: true }),
//                 label: new fields.StringField({ required: true }),
//             }),
//             domainCard: new fields.SchemaField({
//                 id: new fields.StringField({ required: true }),
//                 label: new fields.StringField({ required: true }),
//             }),
//             subclass: new fields.SchemaField({
//                 id: new fields.StringField({ required: true }),
//                 label: new fields.StringField({ required: true }),
//             }),
//         });
//     }
// }

const LevelOptionType = {
    trait: {
        id: 'trait',
        label: 'Character Trait'
    },
    // attribute: {
    //     id: 'attribute',
    //     label: 'Attribute',
    //     choices: attributeChoices,
    // },
    hitPoint: {
        id: 'hitPoint',
        label: 'Hit Points'
    },
    stress: {
        id: 'stress',
        label: 'Stress'
    },
    evasion: {
        id: 'evasion',
        label: 'Evasion'
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
    }
};

// const attributeChoices = {
//     hitPoint: {
//         id: 'hitPoint',
//         label: 'Hit Points',
//     },
//     stress: {
//         id: 'stress',
//         label: 'Stress',
//     },
//     evasion: {
//         id: 'evasion',
//         label: 'Evasion',
//     },
//     proficiency: {
//         id: 'proficiency',
//         label: 'Proficiency',
//     },
// };

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
                    nr: 2,
                    modifier: 1
                },
                proficiency: 1
            },
            availableOptions: 2,
            domainCardByLevel: 1,
            options: {
                trait: {
                    label: 'DAGGERHEART.LevelUp.Options.trait',
                    checkboxQuantity: 3,
                    minCost: 1,
                    type: LevelOptionType.trait.id,
                    amount: 2
                },
                hitPoint: {
                    label: 'DAGGERHEART.LevelUp.Options.hitPoint',
                    checkboxQuantity: 2,
                    minCost: 1,
                    type: LevelOptionType.hitPoint.id,
                    value: 1,
                    value: 1
                },
                stress: {
                    label: 'DAGGERHEART.LevelUp.Options.stress',
                    checkboxQuantity: 2,
                    minCost: 1,
                    type: LevelOptionType.stress.id,
                    value: 1
                },
                experience: {
                    label: 'DAGGERHEART.LevelUp.Options.experience',
                    checkboxQuantity: 1,
                    minCost: 1,
                    type: LevelOptionType.experience.id,
                    value: 1,
                    amount: 2
                },
                domainCard: {
                    label: 'DAGGERHEART.LevelUp.Options.domainCard',
                    checkboxQuantity: 1,
                    minCost: 1,
                    type: LevelOptionType.domainCard.id,
                    amount: 1
                },
                evasion: {
                    label: 'DAGGERHEART.LevelUp.Options.evasion',
                    checkboxQuantity: 1,
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
                    nr: 2,
                    modifier: 1
                },
                proficiency: 1
            },
            availableOptions: 2,
            domainCardByLevel: 1,
            options: {
                trait: {
                    label: 'DAGGERHEART.LevelUp.Options.trait',
                    checkboxQuantity: 3,
                    minCost: 1,
                    type: LevelOptionType.trait.id,
                    amount: 2
                },
                hitPoint: {
                    label: 'DAGGERHEART.LevelUp.Options.hitPoint',
                    checkboxQuantity: 2,
                    minCost: 1,
                    type: LevelOptionType.hitPoint.id,
                    value: 1
                },
                stress: {
                    label: 'DAGGERHEART.LevelUp.Options.stress',
                    checkboxQuantity: 2,
                    minCost: 1,
                    type: LevelOptionType.stress.id,
                    value: 1
                },
                experience: {
                    label: 'DAGGERHEART.LevelUp.Options.experience',
                    checkboxQuantity: 1,
                    minCost: 1,
                    type: LevelOptionType.experience.id,
                    value: 1,
                    amount: 2
                },
                domainCard: {
                    label: 'DAGGERHEART.LevelUp.Options.domainCard',
                    checkboxQuantity: 1,
                    minCost: 1,
                    type: LevelOptionType.domainCard.id,
                    amount: 1
                },
                evasion: {
                    label: 'DAGGERHEART.LevelUp.Options.evasion',
                    checkboxQuantity: 1,
                    minCost: 1,
                    type: LevelOptionType.evasion.id,
                    value: 1
                },
                subclass: {
                    label: 'DAGGERHEART.LevelUp.Options.subclass',
                    checkboxQuantity: 1,
                    minCost: 1,
                    type: LevelOptionType.subclass.id
                },
                proficiency: {
                    label: 'DAGGERHEART.LevelUp.Options.proficiency',
                    checkboxQuantity: 2,
                    minCost: 2,
                    type: LevelOptionType.proficiency.id,
                    value: 1
                },
                multiclass: {
                    label: 'DAGGERHEART.LevelUp.Options.multiclass',
                    checkboxQuantity: 2,
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
                    nr: 2,
                    modifier: 1
                },
                proficiency: 1
            },
            availableOptions: 2,
            domainCardByLevel: 1,
            options: {
                trait: {
                    label: 'DAGGERHEART.LevelUp.Options.trait',
                    checkboxQuantity: 3,
                    minCost: 1,
                    type: LevelOptionType.trait.id,
                    amount: 2
                },
                hitPoint: {
                    label: 'DAGGERHEART.LevelUp.Options.hitPoint',
                    checkboxQuantity: 2,
                    minCost: 1,
                    type: LevelOptionType.hitPoint.id,
                    value: 1
                },
                stress: {
                    label: 'DAGGERHEART.LevelUp.Options.stress',
                    checkboxQuantity: 2,
                    minCost: 1,
                    type: LevelOptionType.stress.id,
                    value: 1
                },
                experience: {
                    label: 'DAGGERHEART.LevelUp.Options.experience',
                    checkboxQuantity: 1,
                    minCost: 1,
                    type: LevelOptionType.experience.id,
                    value: 1,
                    amount: 2
                },
                domainCard: {
                    label: 'DAGGERHEART.LevelUp.Options.domainCard',
                    checkboxQuantity: 1,
                    minCost: 1,
                    type: LevelOptionType.domainCard.id,
                    amount: 1
                },
                evasion: {
                    label: 'DAGGERHEART.LevelUp.Options.evasion',
                    checkboxQuantity: 1,
                    minCost: 1,
                    type: LevelOptionType.evasion.id,
                    value: 1
                },
                subclass: {
                    label: 'DAGGERHEART.LevelUp.Options.subclass',
                    checkboxQuantity: 1,
                    minCost: 1,
                    type: LevelOptionType.subclass.id
                },
                proficiency: {
                    label: 'DAGGERHEART.LevelUp.Options.proficiency',
                    checkboxQuantity: 2,
                    minCost: 2,
                    type: LevelOptionType.proficiency.id,
                    value: 1
                },
                multiclass: {
                    label: 'DAGGERHEART.LevelUp.Options.multiclass',
                    checkboxQuantity: 2,
                    minCost: 2,
                    type: LevelOptionType.multiclass.id
                }
            }
        }
    }
};
