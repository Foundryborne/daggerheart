export const armorFeatures = {
    burning: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.burning.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.burning.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.ArmorFeature.burning.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.burning.description',
                img: 'icons/magic/fire/flame-burning-embers-yellow.webp'
            }
        ]
    },
    channeling: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.channeling.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.channeling.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.ArmorFeature.channeling.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.channeling.description',
                img: 'icons/magic/symbols/rune-sigil-horned-blue.webp',
                changes: [
                    {
                        key: 'system.bonuses.roll.spellcast',
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
                name: 'DAGGERHEART.CONFIG.ArmorFeature.difficult.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.difficult.description',
                img: 'icons/magic/control/buff-flight-wings-red.webp',
                changes: [
                    {
                        key: 'system.traits.agility.value',
                        mode: 2,
                        value: '-1'
                    },
                    {
                        key: 'system.traits.strength.value',
                        mode: 2,
                        value: '-1'
                    },
                    {
                        key: 'system.traits.finesse.value',
                        mode: 2,
                        value: '-1'
                    },
                    {
                        key: 'system.traits.instinct.value',
                        mode: 2,
                        value: '-1'
                    },
                    {
                        key: 'system.traits.presence.value',
                        mode: 2,
                        value: '-1'
                    },
                    {
                        key: 'system.traits.knowledge.value',
                        mode: 2,
                        value: '-1'
                    },
                    {
                        key: 'system.evasion',
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
                name: 'DAGGERHEART.CONFIG.ArmorFeature.flexible.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.flexible.description',
                img: 'icons/magic/movement/abstract-ribbons-red-orange.webp',
                changes: [
                    {
                        key: 'system.evasion',
                        mode: 2,
                        value: '1'
                    }
                ]
            }
        ]
    },
    fortified: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.fortified.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.fortified.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.ArmorFeature.fortified.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.fortified.description',
                img: 'icons/magic/defensive/shield-barrier-glowing-blue.webp',
                changes: [
                    {
                        key: 'system.rules.damageReduction.increasePerArmorMark',
                        mode: 5,
                        value: '2'
                    }
                ]
            }
        ]
    },
    gilded: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.gilded.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.gilded.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.ArmorFeature.gilded.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.gilded.description',
                img: 'icons/magic/control/control-influence-crown-gold.webp',
                changes: [
                    {
                        key: 'system.traits.presence.value',
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
                name: 'DAGGERHEART.CONFIG.ArmorFeature.heavy.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.heavy.description',
                img: 'icons/commodities/metal/ingot-worn-iron.webp',
                changes: [
                    {
                        key: 'system.evasion',
                        mode: 2,
                        value: '-1'
                    }
                ]
            }
        ]
    },
    hopeful: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.hopeful.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.hopeful.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.ArmorFeature.hopeful.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.hopeful.description',
                img: 'icons/magic/holy/barrier-shield-winged-blue.webp'
            }
        ]
    },
    impenetrable: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.impenetrable.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.impenetrable.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.ArmorFeature.impenetrable.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.impenetrable.description',
                img: 'icons/magic/defensive/shield-barrier-flaming-pentagon-purple-orange.webp',
                uses: {
                    max: 1,
                    recovery: 'shortRest',
                    value: 0
                },
                cost: [
                    {
                        type: 'stress',
                        value: 1
                    }
                ]
            }
        ]
    },
    magical: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.magical.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.magical.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.ArmorFeature.magical.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.magical.description',
                img: 'icons/magic/defensive/barrier-shield-dome-blue-purple.webp',
                changes: [
                    {
                        key: 'system.rules.damageReduction.magical',
                        mode: 5,
                        value: 1
                    }
                ]
            }
        ]
    },
    physical: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.physical.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.physical.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.ArmorFeature.physical.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.physical.description',
                img: 'icons/commodities/stone/ore-pile-tan.webp',
                changes: [
                    {
                        key: 'system.rules.damageReduction.physical',
                        mode: 5,
                        value: 1
                    }
                ]
            }
        ]
    },
    quiet: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.quiet.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.quiet.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.ArmorFeature.quiet.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.quiet.description',
                img: 'icons/magic/perception/silhouette-stealth-shadow.webp'
            }
        ]
    },
    reinforced: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.reinforced.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.reinforced.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.ArmorFeature.reinforced.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.reinforced.description',
                img: 'icons/magic/defensive/shield-barrier-glowing-triangle-green.webp',
                effects: [
                    {
                        name: 'DAGGERHEART.CONFIG.ArmorFeature.reinforced.name',
                        description: 'DAGGERHEART.CONFIG.ArmorFeature.reinforced.description',
                        img: 'icons/magic/defensive/shield-barrier-glowing-triangle-green.webp',
                        changes: [
                            {
                                key: 'system.bunuses.damageThresholds.major',
                                mode: 2,
                                value: '2'
                            },
                            {
                                key: 'system.bunuses.damageThresholds.severe',
                                mode: 2,
                                value: '2'
                            }
                        ]
                    }
                ]
            }
        ]
    },
    resilient: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.resilient.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.resilient.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.ArmorFeature.resilient.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.resilient.description',
                img: 'icons/magic/life/heart-cross-purple-orange.webp'
            }
        ]
    },
    sharp: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.sharp.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.sharp.description',
        actions: [
            {
                type: 'damage',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.ArmorFeature.sharp.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.sharp.description',
                img: 'icons/skills/melee/blade-tips-triple-bent-white.webp',
                damage: {
                    parts: [
                        {
                            type: 'physical',
                            value: {
                                custom: {
                                    enabled: true,
                                    formula: '1d4'
                                }
                            }
                        }
                    ]
                }
            }
        ]
    },
    shifting: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.shifting.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.shifting.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.ArmorFeature.shifting.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.shifting.description',
                img: 'icons/magic/defensive/illusion-evasion-echo-purple.webp',
                cost: [
                    {
                        type: 'stress',
                        value: 1
                    }
                ]
            }
        ]
    },
    timeslowing: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.timeslowing.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.timeslowing.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.ArmorFeature.timeslowing.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.timeslowing.description',
                img: 'icons/magic/time/hourglass-brown-orange.webp'
            }
        ]
    },
    truthseeking: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.truthseeking.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.truthseeking.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.ArmorFeature.truthseeking.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.truthseeking.description',
                img: 'icons/magic/perception/orb-crystal-ball-scrying-blue.webp'
            }
        ]
    },
    veryheavy: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.veryHeavy.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.veryHeavy.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.ArmorFeature.veryHeavy.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.veryHeavy.description',
                img: 'icons/commodities/metal/ingot-stamped-steel.webp',
                changes: [
                    {
                        key: 'system.evasion',
                        mode: 2,
                        value: '-2'
                    },
                    {
                        key: 'system.traits.agility.value',
                        mode: 2,
                        value: '-1'
                    }
                ]
            }
        ]
    },
    warded: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.warded.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.warded.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.ArmorFeature.warded.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.warded.description',
                img: 'icons/magic/defensive/barrier-shield-dome-pink.webp',
                changes: [
                    {
                        key: 'system.resistance.magical.reduction',
                        mode: 2,
                        value: '@system.armorScore'
                    }
                ]
            }
        ]
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
                        key: 'system.armorScore',
                        mode: 2,
                        value: 'ITEM.@system.tier + 1'
                    }
                ]
            },
            {
                changes: [
                    {
                        key: 'system.evasion',
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
                        key: 'system.bonuses.damage.primaryWeapon.bonus',
                        mode: 2,
                        value: '@system.levelData.levels.current'
                    }
                ]
            }
        ]
    },
    bouncing: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.bouncing.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.bouncing.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.bouncing.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.bouncing.description',
                img: 'icons/skills/movement/ball-spinning-blue.webp',
                cost: [
                    {
                        type: 'stress',
                        value: 1,
                        scalable: true,
                        step: 1
                    }
                ]
            }
        ]
    },
    brave: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.brave.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.brave.description',
        effects: [
            {
                changes: [
                    {
                        key: 'system.evasion',
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
                        value: 'ITEM.@system.tier'
                    }
                ]
            }
        ]
    },
    brutal: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.brutal.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.brutal.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.brutal.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.brutal.description',
                img: 'icons/skills/melee/strike-dagger-blood-red.webp'
            }
        ]
    },
    charged: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.charged.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.charged.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.charged.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.charged.description',
                img: 'icons/magic/lightning/claws-unarmed-strike-teal.webp',
                cost: [
                    {
                        type: 'stress',
                        value: 1
                    }
                ],
                effects: [
                    {
                        name: 'DAGGERHEART.CONFIG.WeaponFeature.charged.name',
                        description: 'DAGGERHEART.CONFIG.WeaponFeature.charged.description',
                        img: 'icons/magic/lightning/claws-unarmed-strike-teal.webp',
                        changes: [
                            {
                                key: 'system.proficiency',
                                mode: 2,
                                value: '1'
                            }
                        ]
                    }
                ]
            }
        ]
    },
    concussive: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.concussive.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.concussive.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.concussive.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.concussive.description',
                img: 'icons/skills/melee/shield-block-bash-yellow.webp',
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.cumbersome.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.cumbersome.description',
                img: 'icons/commodities/metal/mail-plate-steel.webp',
                changes: [
                    {
                        key: 'system.traits.finesse.value',
                        mode: 2,
                        value: '-1'
                    }
                ]
            }
        ]
    },
    deadly: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.deadly.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.deadly.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.deadly.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.deadly.description',
                img: 'icons/skills/melee/strike-sword-dagger-runes-red.webp'
            }
        ]
    },
    deflecting: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.deflecting.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.deflecting.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.deflecting.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.deflecting.description',
                img: 'icons/skills/melee/hand-grip-sword-strike-orange.webp',
                cost: [
                    {
                        type: 'armorStack',
                        value: 1
                    }
                ],
                effects: [
                    {
                        name: 'DAGGERHEART.CONFIG.WeaponFeature.deflecting.name',
                        description: 'DAGGERHEART.CONFIG.WeaponFeature.deflecting.description',
                        img: 'icons/skills/melee/hand-grip-sword-strike-orange.webp',
                        changes: [
                            {
                                key: 'system.evasion',
                                mode: 2,
                                value: '@system.armorScore'
                            }
                        ]
                    }
                ]
            }
        ]
    },
    destructive: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.destructive.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.destructive.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.destructive.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.destructive.description',
                img: 'icons/skills/melee/strike-flail-spiked-pink.webp'
            }
        ],
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.WeaponFeature.destructive.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.destructive.description',
                img: 'icons/skills/melee/strike-flail-spiked-pink.webp',
                changes: [
                    {
                        key: 'system.traits.agility.value',
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
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.devastating.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.devastating.description',
                img: 'icons/skills/melee/strike-flail-destructive-yellow.webp',
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.doubleDuty.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.doubleDuty.description',
                img: 'icons/skills/melee/sword-shield-stylized-white.webp',
                changes: [
                    {
                        key: 'system.armorScore',
                        mode: 2,
                        value: '1'
                    },
                    {
                        key: 'system.bonuses.damage.primaryWeapon.bonus',
                        mode: 2,
                        value: '1'
                    }
                ]
            }
        ]
    },
    doubledup: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.doubledUp.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.doubledUp.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.doubledUp.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.doubledUp.description',
                img: 'icons/skills/melee/strike-slashes-orange.webp'
            }
        ]
    },
    dueling: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.dueling.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.dueling.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.dueling.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.dueling.description',
                img: 'icons/skills/melee/weapons-crossed-swords-pink.webp'
            }
        ]
    },
    eruptive: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.eruptive.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.eruptive.description',
        actions: [
            {
                type: 'effect', // Should prompt a dc 14 reaction save on adversaries
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.eruptive.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.eruptive.description',
                img: 'icons/skills/melee/strike-hammer-destructive-blue.webp'
            }
        ]
    },
    grappling: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.grappling.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.grappling.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.grappling.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.grappling.description',
                img: 'icons/magic/control/debuff-chains-ropes-net-white.webp',
                cost: [
                    {
                        type: 'hope',
                        value: 1
                    }
                ]
            }
        ]
    },
    greedy: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.greedy.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.greedy.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.greedy.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.greedy.description',
                img: 'icons/commodities/currency/coins-crown-stack-gold.webp',
                // Should cost handfull of gold,
                effects: [
                    {
                        name: 'DAGGERHEART.CONFIG.WeaponFeature.greedy.name',
                        description: 'DAGGERHEART.CONFIG.WeaponFeature.greedy.description',
                        img: 'icons/commodities/currency/coins-crown-stack-gold.webp',
                        changes: [
                            {
                                key: 'system.proficiency',
                                mode: 2,
                                value: '1'
                            }
                        ]
                    }
                ]
            }
        ]
    },
    healing: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.healing.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.healing.description',
        actions: [
            {
                type: 'healing',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.healing.name',
                img: 'icons/magic/life/cross-beam-green.webp',
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.heavy.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.heavy.description',
                img: 'icons/commodities/metal/ingot-worn-iron.webp',
                changes: [
                    {
                        key: 'system.evasion',
                        mode: 2,
                        value: '-1'
                    }
                ]
            }
        ]
    },
    hooked: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.hooked.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.hooked.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.hooked.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.hooked.description',
                img: 'icons/skills/melee/strike-chain-whip-blue.webp'
            }
        ]
    },
    hot: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.hot.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.hot.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.hot.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.hot.description',
                img: 'icons/magic/fire/dagger-rune-enchant-flame-red.webp'
            }
        ]
    },
    invigorating: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.invigorating.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.invigorating.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.invigorating.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.invigorating.description',
                img: 'icons/magic/life/heart-cross-green.webp'
            }
        ]
    },
    lifestealing: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.lifestealing.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.lifestealing.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.lifestealing.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.lifestealing.description',
                img: 'icons/magic/unholy/hand-claw-fire-blue.webp'
            }
        ]
    },
    lockedon: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.lockedOn.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.lockedOn.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.lockedOn.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.lockedOn.description',
                img: 'icons/skills/targeting/crosshair-arrowhead-blue.webp'
            }
        ]
    },
    long: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.long.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.long.description'
        // actions: [
        //     {
        //         type: 'effect',
        //         actionType: 'action',
        //         chatDisplay: true,
        //         name: 'DAGGERHEART.CONFIG.WeaponFeature.long.name',
        //         description: 'DAGGERHEART.CONFIG.WeaponFeature.long.description',
        //         img: 'icons/skills/melee/strike-weapon-polearm-ice-blue.webp',
        //     }
        // ]
    },
    lucky: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.lucky.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.lucky.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.lucky.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.lucky.description',
                img: 'icons/magic/control/buff-luck-fortune-green.webp',
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.massive.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.massive.description',
                img: '',
                changes: [
                    {
                        key: 'system.evasion',
                        mode: 2,
                        value: '-1'
                    },
                    {
                        key: 'system.bonuses.damage.primaryWeapon.extraDice',
                        mode: 2,
                        value: '1'
                    },
                    {
                        key: 'system.rules.weapon.dropLowestDamageDice',
                        mode: 5,
                        value: '1'
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
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.painful.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.painful.description',
                img: 'icons/skills/wounds/injury-face-impact-orange.webp',
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
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.paired.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.paired.description',
                img: 'icons/skills/melee/strike-flail-spiked-red.webp'
            }
        ]
    },
    parry: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.parry.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.parry.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.parry.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.parry.description',
                img: 'icons/skills/melee/shield-block-fire-orange.webp'
            }
        ]
    },
    persuasive: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.persuasive.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.persuasive.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.persuasive.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.persuasive.description',
                img: 'icons/magic/control/hypnosis-mesmerism-eye.webp',
                cost: [
                    {
                        type: 'stress',
                        value: 1
                    }
                ],
                effects: [
                    {
                        name: 'DAGGERHEART.CONFIG.WeaponFeature.persuasive.name',
                        description: 'DAGGERHEART.CONFIG.WeaponFeature.persuasive.description',
                        img: 'icons/magic/control/hypnosis-mesmerism-eye.webp',
                        changes: [
                            {
                                key: 'system.traits.presence.value',
                                mode: 2,
                                value: '2'
                            }
                        ]
                    }
                ]
            }
        ]
    },
    pompous: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.pompous.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.pompous.description'
    },
    powerful: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.powerful.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.powerful.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.powerful.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.powerful.description',
                img: 'icons/magic/control/buff-flight-wings-runes-red-yellow.webp',
                effects: [
                    {
                        name: 'DAGGERHEART.CONFIG.WeaponFeature.powerful.name',
                        description: 'DAGGERHEART.CONFIG.WeaponFeature.powerful.description',
                        img: 'icons/magic/control/buff-flight-wings-runes-red-yellow.webp',
                        changes: [
                            {
                                key: 'system.bonuses.damage.primaryWeapon.extraDice',
                                mode: 2,
                                value: '1'
                            },
                            {
                                key: 'system.rules.weapon.dropLowestDamageDice',
                                mode: 5,
                                value: '1'
                            }
                        ]
                    }
                ]
            }
        ]
    },
    protective: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.protective.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.protective.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.WeaponFeature.protective.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.protective.description',
                img: 'icons/skills/melee/shield-block-gray-orange.webp',
                changes: [
                    {
                        key: 'system.armorScore',
                        mode: 2,
                        value: '1'
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
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.quick.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.quick.description',
                img: 'icons/skills/movement/arrow-upward-yellow.webp',
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.reliable.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.reliable.description',
                img: 'icons/skills/melee/strike-sword-slashing-red.webp',
                changes: [
                    {
                        key: 'system.bonuses.roll.primaryWeapon.attack',
                        mode: 2,
                        value: 1
                    }
                ]
            }
        ]
    },
    reloading: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.reloading.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.reloading.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.reloading.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.reloading.description',
                img: 'icons/weapons/ammunition/shot-round-blue.webp'
            }
        ]
    },
    retractable: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.retractable.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.retractable.description'
    },
    returning: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.returning.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.returning.description'
    },
    selfCorrecting: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.selfCorrecting.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.selfCorrecting.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.WeaponFeature.selfCorrecting.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.selfCorrecting.description',
                img: 'icons/weapons/ammunition/arrow-broadhead-glowing-orange.webp',
                changes: [
                    {
                        key: 'system.rules.damage.flipMinDiceValue',
                        mode: 5,
                        value: 1
                    }
                ]
            }
        ]
    },
    scary: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.scary.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.scary.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.scary.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.scary.description',
                img: 'icons/magic/death/skull-energy-light-purple.webp'
            }
        ]
    },
    serrated: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.serrated.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.serrated.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.WeaponFeature.serrated.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.serrated.description',
                img: 'icons/weapons/ammunition/arrow-broadhead-glowing-orange.webp',
                changes: [
                    {
                        key: 'system.rules.damage.flipMinDiceValue',
                        mode: 5,
                        value: 1
                    }
                ]
            }
        ]
    },
    sharpwing: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.sharpwing.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.sharpwing.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.WeaponFeature.sharpwing.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.sharpwing.description',
                img: 'icons/weapons/swords/sword-winged-pink.webp',
                changes: [
                    {
                        key: 'system.bonuses.damage.primaryWeapon.bonus',
                        mode: 2,
                        value: '@system.traits.agility.value'
                    }
                ]
            }
        ]
    },
    sheltering: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.sheltering.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.sheltering.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.sheltering.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.sheltering.description',
                img: 'icons/skills/melee/shield-block-gray-yellow.webp'
            }
        ]
    },
    startling: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.startling.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.startling.description',
        actions: [
            {
                type: 'resource',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.startling.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.startling.description',
                img: 'icons/magic/control/fear-fright-mask-orange.webp',
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
        description: 'DAGGERHEART.CONFIG.WeaponFeature.versatile.description'
        // versatile: {
        //     characterTrait: '',
        //     range: '',
        //     damage: ''
        // }
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
