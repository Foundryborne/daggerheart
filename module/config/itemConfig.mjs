export const armorFeatures = {
    burning: {
        label: 'DAGGERHEART.Config.ArmorFeature.burning.name',
        description: 'DAGGERHEART.Config.ArmorFeature.burning.description'
    },
    channeling: {
        label: 'DAGGERHEART.Config.ArmorFeature.channeling.name',
        description: 'DAGGERHEART.Config.ArmorFeature.channeling.description',
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
        label: 'DAGGERHEART.Config.ArmorFeature.difficult.name',
        description: 'DAGGERHEART.Config.ArmorFeature.difficult.description',
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
        label: 'DAGGERHEART.Config.ArmorFeature.flexible.name',
        description: 'DAGGERHEART.Config.ArmorFeature.flexible.description',
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
        label: 'DAGGERHEART.Config.ArmorFeature.fortified.name',
        description: 'DAGGERHEART.Config.ArmorFeature.fortified.description'
    },
    gilded: {
        label: 'DAGGERHEART.Config.ArmorFeature.gilded.name',
        description: 'DAGGERHEART.Config.ArmorFeature.gilded.description',
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
        label: 'DAGGERHEART.Config.ArmorFeature.heavy.name',
        description: 'DAGGERHEART.Config.ArmorFeature.heavy.description',
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
        label: 'DAGGERHEART.Config.ArmorFeature.hopeful.name',
        description: 'DAGGERHEART.Config.ArmorFeature.hopeful.description'
    },
    impenetrable: {
        label: 'DAGGERHEART.Config.ArmorFeature.impenetrable.name',
        description: 'DAGGERHEART.Config.ArmorFeature.impenetrable.description'
    },
    magic: {
        label: 'DAGGERHEART.Config.ArmorFeature.magic.name',
        description: 'DAGGERHEART.Config.ArmorFeature.magic.description'
    },
    painful: {
        label: 'DAGGERHEART.Config.ArmorFeature.painful.name',
        description: 'DAGGERHEART.Config.ArmorFeature.painful.description'
    },
    physical: {
        label: 'DAGGERHEART.Config.ArmorFeature.physical.name',
        description: 'DAGGERHEART.Config.ArmorFeature.physical.description'
    },
    quiet: {
        label: 'DAGGERHEART.Config.ArmorFeature.quiet.name',
        description: 'DAGGERHEART.Config.ArmorFeature.quiet.description'
    },
    reinforced: {
        label: 'DAGGERHEART.Config.ArmorFeature.reinforced.name',
        description: 'DAGGERHEART.Config.ArmorFeature.reinforced.description'
    },
    resilient: {
        label: 'DAGGERHEART.Config.ArmorFeature.resilient.name',
        description: 'DAGGERHEART.Config.ArmorFeature.resilient.description'
    },
    sharp: {
        label: 'DAGGERHEART.Config.ArmorFeature.sharp.name',
        description: 'DAGGERHEART.Config.ArmorFeature.sharp.description'
    },
    shifting: {
        label: 'DAGGERHEART.Config.ArmorFeature.shifting.name',
        description: 'DAGGERHEART.Config.ArmorFeature.shifting.description'
    },
    timeslowing: {
        label: 'DAGGERHEART.Config.ArmorFeature.timeslowing.name',
        description: 'DAGGERHEART.Config.ArmorFeature.timeslowing.description'
    },
    truthseeking: {
        label: 'DAGGERHEART.Config.ArmorFeature.truthseeking.name',
        description: 'DAGGERHEART.Config.ArmorFeature.truthseeking.description'
    },
    veryheavy: {
        label: 'DAGGERHEART.Config.ArmorFeature.veryHeavy.name',
        description: 'DAGGERHEART.Config.ArmorFeature.veryHeavy.description',
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
        label: 'DAGGERHEART.Config.ArmorFeature.warded.name',
        description: 'DAGGERHEART.Config.ArmorFeature.warded.description'
    }
};

export const weaponFeatures = {
    barrier: {
        label: 'DAGGERHEART.Config.WeaponFeature.barrier.name',
        description: 'DAGGERHEART.Config.WeaponFeature.barrier.description',
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
        label: 'DAGGERHEART.Config.WeaponFeature.bonded.name',
        description: 'DAGGERHEART.Config.WeaponFeature.bonded.description',
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
        label: 'DAGGERHEART.Config.WeaponFeature.bouncing.name',
        description: 'DAGGERHEART.Config.WeaponFeature.bouncing.description'
    },
    brave: {
        label: 'DAGGERHEART.Config.WeaponFeature.brave.name',
        description: 'DAGGERHEART.Config.WeaponFeature.brave.description',
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
        label: 'DAGGERHEART.Config.WeaponFeature.brutal.name',
        description: 'DAGGERHEART.Config.WeaponFeature.brutal.description'
    },
    charged: {
        label: 'DAGGERHEART.Config.WeaponFeature.charged.name',
        description: 'DAGGERHEART.Config.WeaponFeature.charged.description',
        actions: [
            {
                type: 'effect',
                name: 'DAGGERHEART.Config.WeaponFeature.concussive.name',
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
        label: 'DAGGERHEART.Config.WeaponFeature.concussive.name',
        description: 'DAGGERHEART.Config.WeaponFeature.concussive.description',
        actions: [
            {
                type: 'resource',
                name: 'DAGGERHEART.Config.WeaponFeature.concussive.name',
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
        label: 'DAGGERHEART.Config.WeaponFeature.cumbersome.name',
        description: 'DAGGERHEART.Config.WeaponFeature.cumbersome.description',
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
        label: 'DAGGERHEART.Config.WeaponFeature.deadly.name',
        description: 'DAGGERHEART.Config.WeaponFeature.deadly.description'
    },
    deflecting: {
        label: 'DAGGERHEART.Config.WeaponFeature.deflecting.name',
        description: 'DAGGERHEART.Config.WeaponFeature.deflecting.description'
        // actions: [{
        //     type: 'effect',
        //     name: 'DAGGERHEART.Config.WeaponFeature.Deflecting.Name',
        //     img: 'icons/skills/melee/strike-flail-destructive-yellow.webp',
        //     actionType: 'reaction',
        //     cost: [{
        //         type: 'armorSlot', // Needs armorSlot as type
        //         value: 1
        //     }],
        // }],
    },
    destructive: {
        label: 'DAGGERHEART.Config.WeaponFeature.destructive.name',
        description: 'DAGGERHEART.Config.WeaponFeature.destructive.description',
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
        label: 'DAGGERHEART.Config.WeaponFeature.devastating.name',
        description: 'DAGGERHEART.Config.WeaponFeature.devastating.description',
        actions: [
            {
                type: 'resource',
                name: 'DAGGERHEART.Config.WeaponFeature.devastating.name',
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
        label: 'DAGGERHEART.Config.WeaponFeature.doubleDuty.name',
        description: 'DAGGERHEART.Config.WeaponFeature.doubleDuty.description',
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
        label: 'DAGGERHEART.Config.WeaponFeature.doubledUp.name',
        description: 'DAGGERHEART.Config.WeaponFeature.doubledUp.description'
    },
    dueling: {
        label: 'DAGGERHEART.Config.WeaponFeature.dueling.name',
        description: 'DAGGERHEART.Config.WeaponFeature.dueling.description'
    },
    eruptive: {
        label: 'DAGGERHEART.Config.WeaponFeature.eruptive.name',
        description: 'DAGGERHEART.Config.WeaponFeature.eruptive.description'
    },
    grappling: {
        label: 'DAGGERHEART.Config.WeaponFeature.grappling.name',
        description: 'DAGGERHEART.Config.WeaponFeature.grappling.description',
        actions: [
            {
                type: 'resource',
                name: 'DAGGERHEART.Config.WeaponFeature.grappling.name',
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
        label: 'DAGGERHEART.Config.WeaponFeature.greedy.name',
        description: 'DAGGERHEART.Config.WeaponFeature.greedy.description'
    },
    healing: {
        label: 'DAGGERHEART.Config.WeaponFeature.healing.name',
        description: 'DAGGERHEART.Config.WeaponFeature.healing.description',
        actions: [
            {
                type: 'healing',
                name: 'DAGGERHEART.Config.WeaponFeature.healing.name',
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
        label: 'DAGGERHEART.Config.WeaponFeature.heavy.name',
        description: 'DAGGERHEART.Config.WeaponFeature.heavy.description',
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
        label: 'DAGGERHEART.Config.WeaponFeature.hooked.name',
        description: 'DAGGERHEART.Config.WeaponFeature.hooked.description'
    },
    hot: {
        label: 'DAGGERHEART.Config.WeaponFeature.hot.name',
        description: 'DAGGERHEART.Config.WeaponFeature.hot.description'
    },
    invigorating: {
        label: 'DAGGERHEART.Config.WeaponFeature.invigorating.name',
        description: 'DAGGERHEART.Config.WeaponFeature.invigorating.description'
    },
    lifestealing: {
        label: 'DAGGERHEART.Config.WeaponFeature.lifestealing.name',
        description: 'DAGGERHEART.Config.WeaponFeature.lifestealing.description'
    },
    lockedon: {
        label: 'DAGGERHEART.Config.WeaponFeature.lockedOn.name',
        description: 'DAGGERHEART.Config.WeaponFeature.lockedOn.description'
    },
    long: {
        label: 'DAGGERHEART.Config.WeaponFeature.long.name',
        description: 'DAGGERHEART.Config.WeaponFeature.long.description'
    },
    lucky: {
        label: 'DAGGERHEART.Config.WeaponFeature.lucky.name',
        description: 'DAGGERHEART.Config.WeaponFeature.lucky.description',
        actions: [
            {
                type: 'resource',
                name: 'DAGGERHEART.Config.WeaponFeature.lucky.name',
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
        label: 'DAGGERHEART.Config.WeaponFeature.massive.name',
        description: 'DAGGERHEART.Config.WeaponFeature.massive.description',
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
        label: 'DAGGERHEART.Config.WeaponFeature.painful.name',
        description: 'DAGGERHEART.Config.WeaponFeature.painful.description',
        actions: [
            {
                type: 'resource',
                name: 'DAGGERHEART.Config.WeaponFeature.painful.name',
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
        label: 'DAGGERHEART.Config.WeaponFeature.paired.name',
        description: 'DAGGERHEART.Config.WeaponFeature.paired.description',
        override: {
            bonusDamage: 1
        }
    },
    parry: {
        label: 'DAGGERHEART.Config.WeaponFeature.parry.name',
        description: 'DAGGERHEART.Config.WeaponFeature.parry.description'
    },
    persuasive: {
        label: 'DAGGERHEART.Config.WeaponFeature.persuasive.name',
        description: 'DAGGERHEART.Config.WeaponFeature.persuasive.description'
    },
    pompous: {
        label: 'DAGGERHEART.Config.WeaponFeature.pompous.name',
        description: 'DAGGERHEART.Config.WeaponFeature.pompous.description'
    },
    powerful: {
        label: 'DAGGERHEART.Config.WeaponFeature.powerful.name',
        description: 'DAGGERHEART.Config.WeaponFeature.powerful.description'
    },
    protective: {
        label: 'DAGGERHEART.Config.WeaponFeature.protective.name',
        description: 'DAGGERHEART.Config.WeaponFeature.protective.description',
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
        label: 'DAGGERHEART.Config.WeaponFeature.quick.name',
        description: 'DAGGERHEART.Config.WeaponFeature.quick.description',
        actions: [
            {
                type: 'resource',
                name: 'DAGGERHEART.Config.WeaponFeature.quick.name',
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
        label: 'DAGGERHEART.Config.WeaponFeature.reliable.name',
        description: 'DAGGERHEART.Config.WeaponFeature.reliable.description',
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
        label: 'DAGGERHEART.Config.WeaponFeature.reloading.name',
        description: 'DAGGERHEART.Config.WeaponFeature.reloading.description'
    },
    retractable: {
        label: 'DAGGERHEART.Config.WeaponFeature.retractable.name',
        description: 'DAGGERHEART.Config.WeaponFeature.retractable.description'
    },
    returning: {
        label: 'DAGGERHEART.Config.WeaponFeature.returning.name',
        description: 'DAGGERHEART.Config.WeaponFeature.returning.description'
    },
    scary: {
        label: 'DAGGERHEART.Config.WeaponFeature.scary.name',
        description: 'DAGGERHEART.Config.WeaponFeature.scary.description'
    },
    serrated: {
        label: 'DAGGERHEART.Config.WeaponFeature.serrated.name',
        description: 'DAGGERHEART.Config.WeaponFeature.serrated.description'
    },
    sharpwing: {
        label: 'DAGGERHEART.Config.WeaponFeature.sharpwing.name',
        description: 'DAGGERHEART.Config.WeaponFeature.sharpwing.description'
    },
    sheltering: {
        label: 'DAGGERHEART.Config.WeaponFeature.sheltering.name',
        description: 'DAGGERHEART.Config.WeaponFeature.sheltering.description'
    },
    startling: {
        label: 'DAGGERHEART.Config.WeaponFeature.startling.name',
        description: 'DAGGERHEART.Config.WeaponFeature.startling.description',
        actions: [
            {
                type: 'resource',
                name: 'DAGGERHEART.Config.WeaponFeature.startling.name',
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
        label: 'DAGGERHEART.Config.WeaponFeature.timebending.name',
        description: 'DAGGERHEART.Config.WeaponFeature.timebending.description'
    },
    versatile: {
        label: 'DAGGERHEART.Config.WeaponFeature.versatile.name',
        description: 'DAGGERHEART.Config.WeaponFeature.versatile.description',
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
        label: 'TYPES.Item.ancestry'
    },
    community: {
        id: 'community',
        label: 'TYPES.Item.community'
    },
    companion: {
        id: 'companion',
        label: 'TYPES.Actor.companion'
    },
    class: {
        id: 'class',
        label: 'TYPES.Item.class'
    },
    subclass: {
        id: 'subclass',
        label: 'TYPES.Item.subclass'
    },
    domainCard: {
        id: 'domainCard',
        label: 'TYPES.Item.domainCard'
    },
    armor: {
        id: 'armor',
        label: 'TYPES.Item.armor'
    },
    weapon: {
        id: 'weapon',
        label: 'TYPES.Item.weapon'
    },
    consumable: {
        id: 'consumable',
        label: 'TYPES.Item.consumable'
    },
    miscellaneous: {
        id: 'miscellaneous',
        label: 'TYPES.Item.miscellaneous'
    },
    beastform: {
        if: 'beastform',
        label: 'TYPES.Item.beastform'
    }
};

export const actionTypes = {
    passive: {
        id: 'passive',
        label: 'DAGGERHEART.Config.ActionType.passive'
    },
    action: {
        id: 'action',
        label: 'DAGGERHEART.Config.ActionType.action'
    },
    reaction: {
        id: 'reaction',
        label: 'DAGGERHEART.Config.ActionType.reaction'
    }
};
