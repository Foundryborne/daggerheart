export const armorFeatures = {
    burning: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.burning.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.burning.description'
    },
    channeling: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.channeling.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.channeling.description',
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
        label: 'DAGGERHEART.CONFIG.ArmorFeature.difficult.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.difficult.description',
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
        label: 'DAGGERHEART.CONFIG.ArmorFeature.flexible.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.flexible.description',
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
        label: 'DAGGERHEART.CONFIG.ArmorFeature.fortified.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.fortified.description'
    },
    gilded: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.gilded.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.gilded.description',
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
        label: 'DAGGERHEART.CONFIG.ArmorFeature.heavy.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.heavy.description',
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
        label: 'DAGGERHEART.CONFIG.ArmorFeature.hopeful.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.hopeful.description'
    },
    impenetrable: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.impenetrable.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.impenetrable.description'
    },
    magic: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.magic.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.magic.description'
    },
    painful: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.painful.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.painful.description'
    },
    physical: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.physical.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.physical.description'
    },
    quiet: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.quiet.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.quiet.description'
    },
    reinforced: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.reinforced.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.reinforced.description'
    },
    resilient: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.resilient.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.resilient.description'
    },
    sharp: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.sharp.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.sharp.description'
    },
    shifting: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.shifting.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.shifting.description'
    },
    timeslowing: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.timeslowing.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.timeslowing.description'
    },
    truthseeking: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.truthseeking.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.truthseeking.description'
    },
    veryheavy: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.veryHeavy.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.veryHeavy.description',
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
        label: 'DAGGERHEART.CONFIG.ArmorFeature.warded.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.warded.description'
    }
};

export const weaponFeatures = {
    barrier: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.barrier.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.barrier.description',
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
        label: 'DAGGERHEART.CONFIG.WeaponFeature.bonded.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.bonded.description',
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
        label: 'DAGGERHEART.CONFIG.WeaponFeature.bouncing.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.bouncing.description'
    },
    brave: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.brave.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.brave.description',
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
        label: 'DAGGERHEART.CONFIG.WeaponFeature.brutal.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.brutal.description'
    },
    charged: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.charged.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.charged.description',
        actions: [
            {
                type: 'effect',
                name: 'DAGGERHEART.CONFIG.WeaponFeature.concussive.name',
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
        label: 'DAGGERHEART.CONFIG.WeaponFeature.concussive.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.concussive.description',
        actions: [
            {
                type: 'resource',
                name: 'DAGGERHEART.CONFIG.WeaponFeature.concussive.name',
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
        label: 'DAGGERHEART.CONFIG.WeaponFeature.cumbersome.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.cumbersome.description',
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
        label: 'DAGGERHEART.CONFIG.WeaponFeature.deadly.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.deadly.description'
    },
    deflecting: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.deflecting.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.deflecting.description'
        // actions: [{
        //     type: 'effect',
        //     name: 'DAGGERHEART.CONFIG.WeaponFeature.Deflecting.Name',
        //     img: 'icons/skills/melee/strike-flail-destructive-yellow.webp',
        //     actionType: 'reaction',
        //     cost: [{
        //         type: 'armorSlot', // Needs armorSlot as type
        //         value: 1
        //     }],
        // }],
    },
    destructive: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.destructive.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.destructive.description',
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
        label: 'DAGGERHEART.CONFIG.WeaponFeature.devastating.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.devastating.description',
        actions: [
            {
                type: 'resource',
                name: 'DAGGERHEART.CONFIG.WeaponFeature.devastating.name',
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
        label: 'DAGGERHEART.CONFIG.WeaponFeature.doubleDuty.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.doubleDuty.description',
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
        label: 'DAGGERHEART.CONFIG.WeaponFeature.doubledUp.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.doubledUp.description'
    },
    dueling: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.dueling.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.dueling.description'
    },
    eruptive: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.eruptive.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.eruptive.description'
    },
    grappling: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.grappling.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.grappling.description',
        actions: [
            {
                type: 'resource',
                name: 'DAGGERHEART.CONFIG.WeaponFeature.grappling.name',
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
        label: 'DAGGERHEART.CONFIG.WeaponFeature.greedy.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.greedy.description'
    },
    healing: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.healing.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.healing.description',
        actions: [
            {
                type: 'healing',
                name: 'DAGGERHEART.CONFIG.WeaponFeature.healing.name',
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
        label: 'DAGGERHEART.CONFIG.WeaponFeature.heavy.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.heavy.description',
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
        label: 'DAGGERHEART.CONFIG.WeaponFeature.hooked.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.hooked.description'
    },
    hot: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.hot.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.hot.description'
    },
    invigorating: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.invigorating.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.invigorating.description'
    },
    lifestealing: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.lifestealing.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.lifestealing.description'
    },
    lockedon: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.lockedOn.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.lockedOn.description'
    },
    long: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.long.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.long.description'
    },
    lucky: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.lucky.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.lucky.description',
        actions: [
            {
                type: 'resource',
                name: 'DAGGERHEART.CONFIG.WeaponFeature.lucky.name',
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
        label: 'DAGGERHEART.CONFIG.WeaponFeature.massive.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.massive.description',
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
        label: 'DAGGERHEART.CONFIG.WeaponFeature.painful.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.painful.description',
        actions: [
            {
                type: 'resource',
                name: 'DAGGERHEART.CONFIG.WeaponFeature.painful.name',
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
        label: 'DAGGERHEART.CONFIG.WeaponFeature.paired.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.paired.description',
        override: {
            bonusDamage: 1
        }
    },
    parry: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.parry.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.parry.description'
    },
    persuasive: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.persuasive.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.persuasive.description'
    },
    pompous: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.pompous.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.pompous.description'
    },
    powerful: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.powerful.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.powerful.description'
    },
    protective: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.protective.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.protective.description',
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
        label: 'DAGGERHEART.CONFIG.WeaponFeature.quick.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.quick.description',
        actions: [
            {
                type: 'resource',
                name: 'DAGGERHEART.CONFIG.WeaponFeature.quick.name',
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
        label: 'DAGGERHEART.CONFIG.WeaponFeature.reliable.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.reliable.description',
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
        label: 'DAGGERHEART.CONFIG.WeaponFeature.reloading.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.reloading.description'
    },
    retractable: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.retractable.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.retractable.description'
    },
    returning: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.returning.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.returning.description'
    },
    scary: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.scary.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.scary.description'
    },
    serrated: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.serrated.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.serrated.description'
    },
    sharpwing: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.sharpwing.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.sharpwing.description'
    },
    sheltering: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.sheltering.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.sheltering.description'
    },
    startling: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.startling.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.startling.description',
        actions: [
            {
                type: 'resource',
                name: 'DAGGERHEART.CONFIG.WeaponFeature.startling.name',
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
        label: 'DAGGERHEART.CONFIG.WeaponFeature.timebending.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.timebending.description'
    },
    versatile: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.versatile.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.versatile.description',
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
        label: 'DAGGERHEART.CONFIG.ActionType.passive'
    },
    action: {
        id: 'action',
        label: 'DAGGERHEART.CONFIG.ActionType.action'
    },
    reaction: {
        id: 'reaction',
        label: 'DAGGERHEART.CONFIG.ActionType.reaction'
    }
};
