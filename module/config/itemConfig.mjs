export const armorFeatures = {
    burning: {
        label: 'DAGGERHEART.ArmorFeature.Burning.Name',
        description: 'DAGGERHEART.ArmorFeature.Burning.Description'
    },
    channeling: {
        label: 'DAGGERHEART.ArmorFeature.Channeling.Name',
        description: 'DAGGERHEART.ArmorFeature.Channeling.Description',
        effects: [
            {
                changes: [
                    {
                        key: 'system.bonuses.spellcast',
                        mode: 2,
                        value: '1'
                    }
                ]
            }
        ]
    },
    difficult: {
        label: 'DAGGERHEART.ArmorFeature.Difficult.Name',
        description: 'DAGGERHEART.ArmorFeature.Difficult.Description',
        effects: [
            {
                changes: [
                    {
                        key: 'system.traits.agility.bonus',
                        mode: 2,
                        value: '-1'
                    },
                    {
                        key: 'system.traits.strength.bonus',
                        mode: 2,
                        value: '-1'
                    },
                    {
                        key: 'system.traits.finesse.bonus',
                        mode: 2,
                        value: '-1'
                    },
                    {
                        key: 'system.traits.instinct.bonus',
                        mode: 2,
                        value: '-1'
                    },
                    {
                        key: 'system.traits.presence.bonus',
                        mode: 2,
                        value: '-1'
                    },
                    {
                        key: 'system.traits.knowledge.bonus',
                        mode: 2,
                        value: '-1'
                    },
                    {
                        key: 'system.evasion.bonus',
                        mode: 2,
                        value: '-1'
                    }
                ]
            }
        ]
    },
    flexible: {
        label: 'DAGGERHEART.ArmorFeature.Flexible.Name',
        description: 'DAGGERHEART.ArmorFeature.Flexible.Description',
        effects: [
            {
                changes: [
                    {
                        key: 'system.evasion.bonus',
                        mode: 2,
                        value: '1'
                    }
                ]
            }
        ]
    },
    fortified: {
        label: 'DAGGERHEART.ArmorFeature.Fortified.Name',
        description: 'DAGGERHEART.ArmorFeature.Fortified.Description'
    },
    gilded: {
        label: 'DAGGERHEART.ArmorFeature.Gilded.Name',
        description: 'DAGGERHEART.ArmorFeature.Gilded.Description',
        effects: [
            {
                changes: [
                    {
                        key: 'system.traits.presence.bonus',
                        mode: 2,
                        value: '1'
                    }
                ]
            }
        ]
    },
    heavy: {
        label: 'DAGGERHEART.ArmorFeature.Heavy.Name',
        description: 'DAGGERHEART.ArmorFeature.Heavy.Description',
        effects: [
            {
                changes: [
                    {
                        key: 'system.evasion.bonus',
                        mode: 2,
                        value: '-1'
                    }
                ]
            }
        ]
    },
    hopeful: {
        label: 'DAGGERHEART.ArmorFeature.Hopeful.Name',
        description: 'DAGGERHEART.ArmorFeature.Hopeful.Description'
    },
    impenetrable: {
        label: 'DAGGERHEART.ArmorFeature.Impenetrable.Name',
        description: 'DAGGERHEART.ArmorFeature.Impenetrable.Description'
    },
    magic: {
        label: 'DAGGERHEART.ArmorFeature.Magic.Name',
        description: 'DAGGERHEART.ArmorFeature.Magic.Description'
    },
    painful: {
        label: 'DAGGERHEART.ArmorFeature.Painful.Name',
        description: 'DAGGERHEART.ArmorFeature.Painful.Description'
    },
    physical: {
        label: 'DAGGERHEART.ArmorFeature.Physical.Name',
        description: 'DAGGERHEART.ArmorFeature.Physical.Description'
    },
    quiet: {
        label: 'DAGGERHEART.ArmorFeature.Quiet.Name',
        description: 'DAGGERHEART.ArmorFeature.Quiet.Description'
    },
    reinforced: {
        label: 'DAGGERHEART.ArmorFeature.Reinforced.Name',
        description: 'DAGGERHEART.ArmorFeature.Reinforced.Description'
    },
    resilient: {
        label: 'DAGGERHEART.ArmorFeature.Resilient.Name',
        description: 'DAGGERHEART.ArmorFeature.Resilient.Description'
    },
    sharp: {
        label: 'DAGGERHEART.ArmorFeature.Sharp.Name',
        description: 'DAGGERHEART.ArmorFeature.Sharp.Description'
    },
    shifting: {
        label: 'DAGGERHEART.ArmorFeature.Shifting.Name',
        description: 'DAGGERHEART.ArmorFeature.Shifting.Description'
    },
    timeslowing: {
        label: 'DAGGERHEART.ArmorFeature.Timeslowing.Name',
        description: 'DAGGERHEART.ArmorFeature.Timeslowing.Description'
    },
    truthseeking: {
        label: 'DAGGERHEART.ArmorFeature.Truthseeking.Name',
        description: 'DAGGERHEART.ArmorFeature.Truthseeking.Description'
    },
    veryheavy: {
        label: 'DAGGERHEART.ArmorFeature.VeryHeavy.Name',
        description: 'DAGGERHEART.ArmorFeature.VeryHeavy.Description',
        effects: [
            {
                changes: [
                    {
                        key: 'system.evasion.bonus',
                        mode: 2,
                        value: '-2'
                    },
                    {
                        key: 'system.traits.agility.bonus',
                        mode: 2,
                        value: '-1'
                    }
                ]
            }
        ]
    },
    warded: {
        label: 'DAGGERHEART.ArmorFeature.Warded.Name',
        description: 'DAGGERHEART.ArmorFeature.Warded.Description'
    }
};

export const weaponFeatures = {
    barrier: {
        label: 'DAGGERHEART.WeaponFeature.Barrier.Name',
        description: 'DAGGERHEART.WeaponFeature.Barrier.Description',
        effects: [
            {
                changes: [
                    {
                        key: 'system.bonuses.armorScore',
                        mode: 2,
                        value: '@system.tier + 1'
                    }
                ]
            },
            {
                changes: [
                    {
                        key: 'system.evasion.bonus',
                        mode: 2,
                        value: '-1'
                    }
                ]
            }
        ]
    },
    bonded: {
        label: 'DAGGERHEART.WeaponFeature.Bonded.Name',
        description: 'DAGGERHEART.WeaponFeature.Bonded.Description',
        effects: [
            {
                changes: [
                    {
                        key: 'system.bonuses.damage',
                        mode: 2,
                        value: 'system.levelData.levels.current'
                    }
                ]
            }
        ]
    },
    bouncing: {
        label: 'DAGGERHEART.WeaponFeature.Bouncing.Name',
        description: 'DAGGERHEART.WeaponFeature.Bouncing.Description'
    },
    brave: {
        label: 'DAGGERHEART.WeaponFeature.Brave.Name',
        description: 'DAGGERHEART.WeaponFeature.Brave.Description',
        effects: [
            {
                changes: [
                    {
                        key: 'system.evasion.bonus',
                        mode: 2,
                        value: '-1'
                    }
                ]
            },
            {
                changes: [
                    {
                        key: 'system.damageThresholds.severe',
                        mode: 2,
                        value: '3'
                    }
                ]
            }
        ]
    },
    brutal: {
        label: 'DAGGERHEART.WeaponFeature.Brutal.Name',
        description: 'DAGGERHEART.WeaponFeature.Brutal.Description'
    },
    charged: {
        label: 'DAGGERHEART.WeaponFeature.Charged.Name',
        description: 'DAGGERHEART.WeaponFeature.Charged.Description',
        actions: [
            {
                type: 'effect',
                name: 'DAGGERHEART.WeaponFeature.Concussive.Name',
                img: 'icons/skills/melee/shield-damaged-broken-brown.webp',
                actionType: 'action',
                cost: [
                    {
                        type: 'stress',
                        value: 1
                    }
                ]
                // Should add an effect with path system.proficiency.bonus +1
            }
        ]
    },
    concussive: {
        label: 'DAGGERHEART.WeaponFeature.Concussive.Name',
        description: 'DAGGERHEART.WeaponFeature.Concussive.Description',
        actions: [
            {
                type: 'resource',
                name: 'DAGGERHEART.WeaponFeature.Concussive.Name',
                img: 'icons/skills/melee/shield-damaged-broken-brown.webp',
                actionType: 'action',
                cost: [
                    {
                        type: 'hope',
                        value: 1
                    }
                ]
            }
        ]
    },
    cumbersome: {
        label: 'DAGGERHEART.WeaponFeature.Cumbersome.Name',
        description: 'DAGGERHEART.WeaponFeature.Cumbersome.Description',
        effects: [
            {
                changes: [
                    {
                        key: 'system.traits.finesse.bonus',
                        mode: 2,
                        value: '-1'
                    }
                ]
            }
        ]
    },
    deadly: {
        label: 'DAGGERHEART.WeaponFeature.Deadly.Name',
        description: 'DAGGERHEART.WeaponFeature.Deadly.Description'
    },
    deflecting: {
        label: 'DAGGERHEART.WeaponFeature.Deflecting.Name',
        description: 'DAGGERHEART.WeaponFeature.Deflecting.Description'
        // actions: [{
        //     type: 'effect',
        //     name: 'DAGGERHEART.WeaponFeature.Deflecting.Name',
        //     img: 'icons/skills/melee/strike-flail-destructive-yellow.webp',
        //     actionType: 'reaction',
        //     cost: [{
        //         type: 'armorSlot', // Needs armorSlot as type
        //         value: 1
        //     }],
        // }],
    },
    destructive: {
        label: 'DAGGERHEART.WeaponFeature.Destructive.Name',
        description: 'DAGGERHEART.WeaponFeature.Destructive.Description',
        effects: [
            {
                changes: [
                    {
                        key: 'system.traits.agility.bonus',
                        mode: 2,
                        value: '-1'
                    }
                ]
            }
        ]
    },
    devastating: {
        label: 'DAGGERHEART.WeaponFeature.Devastating.Name',
        description: 'DAGGERHEART.WeaponFeature.Devastating.Description',
        actions: [
            {
                type: 'resource',
                name: 'DAGGERHEART.WeaponFeature.Devastating.Name',
                img: 'icons/skills/melee/strike-flail-destructive-yellow.webp',
                actionType: 'action',
                cost: [
                    {
                        type: 'stress',
                        value: 1
                    }
                ]
            }
        ]
    },
    doubleduty: {
        label: 'DAGGERHEART.WeaponFeature.DoubleDuty.Name',
        description: 'DAGGERHEART.WeaponFeature.DoubleDuty.Description',
        effects: [
            {
                changes: [
                    {
                        key: 'system.bonuses.armorScore',
                        mode: 2,
                        value: '1'
                    }
                ]
            }
        ]
    },
    doubledup: {
        label: 'DAGGERHEART.WeaponFeature.DoubledUp.Name',
        description: 'DAGGERHEART.WeaponFeature.DoubledUp.Description'
    },
    dueling: {
        label: 'DAGGERHEART.WeaponFeature.Dueling.Name',
        description: 'DAGGERHEART.WeaponFeature.Dueling.Description'
    },
    eruptive: {
        label: 'DAGGERHEART.WeaponFeature.Eruptive.Name',
        description: 'DAGGERHEART.WeaponFeature.Eruptive.Description'
    },
    grappling: {
        label: 'DAGGERHEART.WeaponFeature.Grappling.Name',
        description: 'DAGGERHEART.WeaponFeature.Grappling.Description',
        actions: [
            {
                type: 'resource',
                name: 'DAGGERHEART.WeaponFeature.Grappling.Name',
                img: 'icons/magic/control/debuff-chains-ropes-net-white.webp',
                actionType: 'action',
                cost: [
                    {
                        type: 'stress',
                        value: 1
                    }
                ]
            }
        ]
    },
    greedy: {
        label: 'DAGGERHEART.WeaponFeature.Greedy.Name',
        description: 'DAGGERHEART.WeaponFeature.Greedy.Description'
    },
    healing: {
        label: 'DAGGERHEART.WeaponFeature.Healing.Name',
        description: 'DAGGERHEART.WeaponFeature.Healing.Description',
        actions: [
            {
                type: 'healing',
                name: 'DAGGERHEART.WeaponFeature.Healing.Name',
                img: 'icons/magic/life/cross-beam-green.webp',
                actionType: 'action',
                healing: {
                    type: 'health',
                    value: {
                        custom: {
                            enabled: true,
                            formula: '1'
                        }
                    }
                }
            }
        ]
    },
    heavy: {
        label: 'DAGGERHEART.WeaponFeature.Heavy.Name',
        description: 'DAGGERHEART.WeaponFeature.Heavy.Description',
        effects: [
            {
                changes: [
                    {
                        key: 'system.evasion.bonus',
                        mode: 2,
                        value: '-1'
                    }
                ]
            }
        ]
    },
    hooked: {
        label: 'DAGGERHEART.WeaponFeature.Hooked.Name',
        description: 'DAGGERHEART.WeaponFeature.Hooked.Description'
    },
    hot: {
        label: 'DAGGERHEART.WeaponFeature.Hot.Name',
        description: 'DAGGERHEART.WeaponFeature.Hot.Description'
    },
    invigorating: {
        label: 'DAGGERHEART.WeaponFeature.Invigorating.Name',
        description: 'DAGGERHEART.WeaponFeature.Invigorating.Description'
    },
    lifestealing: {
        label: 'DAGGERHEART.WeaponFeature.Lifestealing.Name',
        description: 'DAGGERHEART.WeaponFeature.Lifestealing.Description'
    },
    lockedon: {
        label: 'DAGGERHEART.WeaponFeature.LockedOn.Name',
        description: 'DAGGERHEART.WeaponFeature.LockedOn.Description'
    },
    long: {
        label: 'DAGGERHEART.WeaponFeature.Long.Name',
        description: 'DAGGERHEART.WeaponFeature.Long.Description'
    },
    lucky: {
        label: 'DAGGERHEART.WeaponFeature.Lucky.Name',
        description: 'DAGGERHEART.WeaponFeature.Lucky.Description',
        actions: [
            {
                type: 'resource',
                name: 'DAGGERHEART.WeaponFeature.Lucky.Name',
                img: 'icons/magic/control/buff-luck-fortune-green.webp',
                actionType: 'action',
                cost: [
                    {
                        type: 'stress',
                        value: 1
                    }
                ]
            }
        ]
    },
    massive: {
        label: 'DAGGERHEART.WeaponFeature.Massive.Name',
        description: 'DAGGERHEART.WeaponFeature.Massive.Description',
        effects: [
            {
                changes: [
                    {
                        key: 'system.evasion.bonus',
                        mode: 2,
                        value: '-1'
                    }
                ]
            }
        ]
    },
    painful: {
        label: 'DAGGERHEART.WeaponFeature.Painful.Name',
        description: 'DAGGERHEART.WeaponFeature.Painful.Description',
        actions: [
            {
                type: 'resource',
                name: 'DAGGERHEART.WeaponFeature.Painful.Name',
                img: 'icons/skills/wounds/injury-face-impact-orange.webp',
                actionType: 'action',
                cost: [
                    {
                        type: 'stress',
                        value: 1
                    }
                ]
            }
        ]
    },
    paired: {
        label: 'DAGGERHEART.WeaponFeature.Paired.Name',
        description: 'DAGGERHEART.WeaponFeature.Paired.Description',
        override: {
            bonusDamage: 1
        }
    },
    parry: {
        label: 'DAGGERHEART.WeaponFeature.Parry.Name',
        description: 'DAGGERHEART.WeaponFeature.Parry.Description'
    },
    persuasive: {
        label: 'DAGGERHEART.WeaponFeature.Persuasive.Name',
        description: 'DAGGERHEART.WeaponFeature.Persuasive.Description'
    },
    pompous: {
        label: 'DAGGERHEART.WeaponFeature.Pompous.Name',
        description: 'DAGGERHEART.WeaponFeature.Pompous.Description'
    },
    powerful: {
        label: 'DAGGERHEART.WeaponFeature.Powerful.Name',
        description: 'DAGGERHEART.WeaponFeature.Powerful.Description'
    },
    protective: {
        label: 'DAGGERHEART.WeaponFeature.Protective.Name',
        description: 'DAGGERHEART.WeaponFeature.Protective.Description',
        effects: [
            {
                changes: [
                    {
                        key: 'system.bonuses.armorScore',
                        mode: 2,
                        value: '@system.tier'
                    }
                ]
            }
        ]
    },
    quick: {
        label: 'DAGGERHEART.WeaponFeature.Quick.Name',
        description: 'DAGGERHEART.WeaponFeature.Quick.Description',
        actions: [
            {
                type: 'resource',
                name: 'DAGGERHEART.WeaponFeature.Quick.Name',
                img: 'icons/skills/movement/arrow-upward-yellow.webp',
                actionType: 'action',
                cost: [
                    {
                        type: 'stress',
                        value: 1
                    }
                ]
            }
        ]
    },
    reliable: {
        label: 'DAGGERHEART.WeaponFeature.Reliable.Name',
        description: 'DAGGERHEART.WeaponFeature.Reliable.Description',
        effects: [
            {
                changes: [
                    {
                        key: 'system.bonuses.attack',
                        mode: 2,
                        value: 1
                    }
                ]
            }
        ]
    },
    reloading: {
        label: 'DAGGERHEART.WeaponFeature.Reloading.Name',
        description: 'DAGGERHEART.WeaponFeature.Reloading.Description'
    },
    retractable: {
        label: 'DAGGERHEART.WeaponFeature.Retractable.Name',
        description: 'DAGGERHEART.WeaponFeature.Retractable.Description'
    },
    returning: {
        label: 'DAGGERHEART.WeaponFeature.Returning.Name',
        description: 'DAGGERHEART.WeaponFeature.Returning.Description'
    },
    scary: {
        label: 'DAGGERHEART.WeaponFeature.Scary.Name',
        description: 'DAGGERHEART.WeaponFeature.Scary.Description'
    },
    serrated: {
        label: 'DAGGERHEART.WeaponFeature.Serrated.Name',
        description: 'DAGGERHEART.WeaponFeature.Serrated.Description'
    },
    sharpwing: {
        label: 'DAGGERHEART.WeaponFeature.Sharpwing.Name',
        description: 'DAGGERHEART.WeaponFeature.Sharpwing.Description'
    },
    sheltering: {
        label: 'DAGGERHEART.WeaponFeature.Sheltering.Name',
        description: 'DAGGERHEART.WeaponFeature.Sheltering.Description'
    },
    startling: {
        label: 'DAGGERHEART.WeaponFeature.Startling.Name',
        description: 'DAGGERHEART.WeaponFeature.Startling.Description',
        actions: [
            {
                type: 'resource',
                name: 'DAGGERHEART.WeaponFeature.Startling.Name',
                img: 'icons/magic/control/fear-fright-mask-orange.webp',
                actionType: 'action',
                cost: [
                    {
                        type: 'stress',
                        value: 1
                    }
                ]
            }
        ]
    },
    timebending: {
        label: 'DAGGERHEART.WeaponFeature.Timebending.Name',
        description: 'DAGGERHEART.WeaponFeature.Timebending.Description'
    },
    versatile: {
        label: 'DAGGERHEART.WeaponFeature.Versatile.Name',
        description: 'DAGGERHEART.WeaponFeature.Versatile.Description',
        versatile: {
            characterTrait: '',
            range: '',
            damage: ''
        }
    }
};

export const featureTypes = {
    ancestry: {
        id: 'ancestry',
        label: 'DAGGERHEART.Feature.Type.ancestry'
    },
    community: {
        id: 'community',
        label: 'DAGGERHEART.Feature.Type.community'
    },
    class: {
        id: 'class',
        label: 'DAGGERHEART.Feature.Type.class'
    },
    subclass: {
        id: 'subclass',
        label: 'DAGGERHEART.Feature.Type.subclass'
    },
    classHope: {
        id: 'classHope',
        label: 'DAGGERHEART.Feature.Type.classHope'
    },
    domainCard: {
        id: 'domainCard',
        label: 'DAGGERHEART.Feature.Type.domainCard'
    },
    equipment: {
        id: 'equipment',
        label: 'DAGGERHEART.Feature.Type.equipment'
    }
};

export const valueTypes = {
    normal: {
        id: 'normal',
        name: 'DAGGERHEART.Feature.ValueType.Normal',
        data: {
            value: 0,
            max: 0
        }
    },
    input: {
        id: 'input',
        name: 'DAGGERHEART.Feature.ValueType.Input',
        data: {
            value: null
        }
    },
    dice: {
        id: 'dice',
        name: 'DAGGERHEART.Feature.ValueType.Dice',
        data: {
            value: null
        }
    }
};

export const actionTypes = {
    passive: {
        id: 'passive',
        label: 'DAGGERHEART.ActionType.passive'
    },
    action: {
        id: 'action',
        label: 'DAGGERHEART.ActionType.action'
    },
    reaction: {
        id: 'reaction',
        label: 'DAGGERHEART.ActionType.reaction'
    }
};
