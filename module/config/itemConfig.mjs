export const armorFeatures = {
    burning: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.burning.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.burning.description',
        actions: [
            {
                type: 'damage',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.ArmorFeature.burning.actions.burn.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.burning.actions.burn.description',
                img: 'icons/magic/fire/flame-burning-embers-yellow.webp',
                range: 'melee',
                target: {
                    type: 'hostile'
                },
                damage: {
                    parts: [
                        {
                            applyTo: 'stress',
                            value: {
                                custom: {
                                    enabled: true,
                                    formula: '1'
                                }
                            }
                        }
                    ]
                }
            }
        ]
    },
    channeling: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.channeling.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.channeling.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.ArmorFeature.channeling.effects.channeling.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.channeling.effects.channeling.description',
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
                name: 'DAGGERHEART.CONFIG.ArmorFeature.difficult.effects.difficult.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.difficult.effects.difficult.description',
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
                name: 'DAGGERHEART.CONFIG.ArmorFeature.flexible.effects.flexible.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.flexible.effects.flexible.description',
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
                name: 'DAGGERHEART.CONFIG.ArmorFeature.fortified.effects.fortified.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.fortified.effects.fortified.description',
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
                name: 'DAGGERHEART.CONFIG.ArmorFeature.gilded.effects.gilded.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.gilded.effects.gilded.description',
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
                name: 'DAGGERHEART.CONFIG.ArmorFeature.heavy.effects.heavy.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.heavy.effects.heavy.description',
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
                name: 'DAGGERHEART.CONFIG.ArmorFeature.hopeful.actions.hope.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.hopeful.actions.hope.description',
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
                name: 'DAGGERHEART.CONFIG.ArmorFeature.impenetrable.actions.impenetrable.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.impenetrable.actions.impenetrable.description',
                img: 'icons/magic/defensive/shield-barrier-flaming-pentagon-purple-orange.webp',
                uses: {
                    max: 1,
                    recovery: 'shortRest',
                    value: 0
                },
                cost: [
                    {
                        key: 'stress',
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
                name: 'DAGGERHEART.CONFIG.ArmorFeature.magical.effects.magical.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.magical.effects.magical.description',
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
    painful: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.painful.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.painful.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.ArmorFeature.painful.actions.pain.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.painful.actions.pain.description',
                img: 'icons/skills/wounds/injury-face-impact-orange.webp',
                cost: [
                    {
                        key: 'stress',
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
                name: 'DAGGERHEART.CONFIG.ArmorFeature.physical.effects.physical.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.physical.effects.physical.description',
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
                name: 'DAGGERHEART.CONFIG.ArmorFeature.quiet.actions.quiet.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.quiet.actions.quiet.description',
                img: 'icons/magic/perception/silhouette-stealth-shadow.webp'
            }
        ]
    },
    reinforced: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.reinforced.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.reinforced.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.ArmorFeature.reinforced.effects.reinforced.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.reinforced.effects.reinforced.description',
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
    },
    resilient: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.resilient.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.resilient.description',
        actions: [
            {
                type: 'attack',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.ArmorFeature.resilient.actions.resilient.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.resilient.actions.resilient.description',
                img: 'icons/magic/life/heart-cross-purple-orange.webp',
                roll: {
                    type: 'diceSet',
                    diceRolling: {
                        compare: 'equal',
                        dice: 'd6',
                        multiplier: 'flat',
                        flatMultiplier: 1,
                        treshold: 6
                    }
                }
            }
        ]
    },
    sharp: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.sharp.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.sharp.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.ArmorFeature.sharp.effects.sharp.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.sharp.effects.sharp.description',
                img: 'icons/magic/defensive/shield-barrier-glowing-triangle-green.webp',
                changes: [
                    {
                        key: 'system.bonuses.damage.primaryWeapon.dice',
                        mode: 2,
                        value: '1d4'
                    },
                    {
                        key: 'system.bonuses.damage.secondaryWeapon.dice',
                        mode: 2,
                        value: '1d4'
                    }
                ]
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
                name: 'DAGGERHEART.CONFIG.ArmorFeature.shifting.actions.shift.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.shifting.actions.shift.description',
                img: 'icons/magic/defensive/illusion-evasion-echo-purple.webp',
                cost: [
                    {
                        key: 'stress',
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
                type: 'attack',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.ArmorFeature.timeslowing.actions.slowTime.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.timeslowing.actions.slowTime.description',
                img: 'icons/magic/time/hourglass-brown-orange.webp',
                cost: [
                    {
                        key: 'armorSlot',
                        value: 1
                    }
                ],
                roll: {
                    type: 'diceSet',
                    diceRolling: {
                        dice: 'd4',
                        multiplier: 'flat',
                        flatMultiplier: 1
                    }
                }
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
                name: 'DAGGERHEART.CONFIG.ArmorFeature.truthseeking.actions.truthseeking.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.truthseeking.actions.truthseeking.description',
                img: 'icons/magic/perception/orb-crystal-ball-scrying-blue.webp'
            }
        ]
    },
    veryheavy: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.veryHeavy.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.veryHeavy.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.ArmorFeature.veryHeavy.effects.veryHeavy.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.veryHeavy.effects.veryHeavy.description',
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
                name: 'DAGGERHEART.CONFIG.ArmorFeature.warded.effects.warded.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.warded.effects.warded.description',
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.barrier.effects.barrier.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.barrier.effects.barrier.description',
                img: 'icons/skills/melee/shield-block-bash-blue.webp',
                changes: [
                    {
                        key: 'system.armorScore',
                        mode: 2,
                        value: 'ITEM.@system.tier + 1'
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
    bonded: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.bonded.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.bonded.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.WeaponFeature.bonded.effects.damage.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.bonded.effects.damage.description',
                img: 'icons/magic/symbols/chevron-elipse-circle-blue.webp',
                changes: [
                    {
                        key: 'system.bonuses.damage.primaryWeapon.bonus',
                        mode: 2,
                        value: '@system.levelData.level.current'
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.bouncing.actions.bounce.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.bouncing.actions.bounce.description',
                img: 'icons/skills/movement/ball-spinning-blue.webp',
                cost: [
                    {
                        key: 'stress',
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.brave.effects.brave.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.brave.effects.brave.description',
                img: 'icons/magic/life/heart-cross-strong-flame-purple-orange.webp',
                changes: [
                    {
                        key: 'system.evasion',
                        mode: 2,
                        value: '-1'
                    },
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.brutal.actions.addDamage.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.brutal.actions.addDamage.description',
                img: 'icons/skills/melee/strike-dagger-blood-red.webp'
            }
        ]
    },
    burning: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.burning.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.burning.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.burning.actions.burn.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.burning.actions.burn.description',
                img: 'icons/magic/fire/blast-jet-stream-embers-orange.webp'
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.charged.actions.markStress.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.charged.actions.markStress.description',
                img: 'icons/magic/lightning/claws-unarmed-strike-teal.webp',
                target: {
                    type: 'self'
                },
                cost: [
                    {
                        key: 'stress',
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.concussive.actions.attack.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.concussive.actions.attack.description',
                img: 'icons/skills/melee/shield-block-bash-yellow.webp',
                target: {
                    type: 'any'
                },
                cost: [
                    {
                        key: 'hope',
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.cumbersome.effects.cumbersome.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.cumbersome.effects.cumbersome.description',
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.deadly.actions.extraDamage.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.deadly.actions.extraDamage.description',
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.deflecting.actions.deflect.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.deflecting.actions.deflect.description',
                img: 'icons/skills/melee/hand-grip-sword-strike-orange.webp',
                target: {
                    type: 'self'
                },
                cost: [
                    {
                        type: 'armor',
                        value: 1
                    }
                ],
                effects: [
                    {
                        name: 'DAGGERHEART.CONFIG.WeaponFeature.deflecting.effects.deflecting.name',
                        description: 'DAGGERHEART.CONFIG.WeaponFeature.deflecting.effects.deflecting.description',
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
                type: 'damage',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.destructive.actions.attack.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.destructive.actions.attack.descriptive',
                img: 'icons/skills/melee/strike-flail-spiked-pink.webp',
                range: 'veryClose',
                target: {
                    type: 'hostile'
                },
                damage: {
                    parts: [
                        {
                            applyTo: 'stress',
                            value: {
                                custom: {
                                    enabled: true,
                                    formula: '1'
                                }
                            }
                        }
                    ]
                }
            }
        ],
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.WeaponFeature.destructive.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.destructive.effects.agility',
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.devastating.actions.devastate.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.devastating.actions.devastate.description',
                img: 'icons/skills/melee/strike-flail-destructive-yellow.webp',
                cost: [
                    {
                        key: 'stress',
                        value: 1
                    }
                ]
            }
        ]
    },
    doubleDuty: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.doubleDuty.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.doubleDuty.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.WeaponFeature.doubleDuty.effects.doubleDuty.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.doubleDuty.effects.doubleDuty.description',
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
    doubledUp: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.doubledUp.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.doubledUp.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.doubledUp.actions.doubleUp.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.doubledUp.actions.doubleUp.description',
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.dueling.actions.duel.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.dueling.actions.duel.description',
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.eruptive.actions.erupt.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.eruptive.actions.erupt.description',
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.grappling.actions.grapple.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.grappling.actions.grapple.description',
                img: 'icons/magic/control/debuff-chains-ropes-net-white.webp',
                cost: [
                    {
                        key: 'hope',
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
                // Should cost handful of gold,
                effects: [
                    {
                        name: 'DAGGERHEART.CONFIG.WeaponFeature.greedy.actions.greed.name',
                        description: 'DAGGERHEART.CONFIG.WeaponFeature.greedy.actions.greed.description',
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.healing.actions.heal.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.healing.actions.heal.description',
                img: 'icons/magic/life/cross-beam-green.webp',
                target: {
                    type: 'self'
                },
                damage: {
                    parts: [
                        {
                            applyTo: 'hitPoints',
                            value: {
                                custom: {
                                    enabled: true,
                                    formula: 1
                                }
                            }
                        }
                    ]
                }
            }
        ]
    },
    heavy: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.heavy.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.heavy.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.WeaponFeature.heavy.effects.heavy.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.heavy.effects.heavy.description',
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.hooked.actions.hook.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.hooked.actions.hook.description',
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.hot.actions.hot.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.hot.actions.hot.description',
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.invigorating.actions.invigorate.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.invigorating.actions.invigorate.description',
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.lifestealing.actions.lifesteal.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.lifestealing.actions.lifesteal.description',
                img: 'icons/magic/unholy/hand-claw-fire-blue.webp'
            }
        ]
    },
    lockedOn: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.lockedOn.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.lockedOn.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.lockedOn.actions.lockOn.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.lockedOn.actions.lockOn.description',
                img: 'icons/skills/targeting/crosshair-arrowhead-blue.webp'
            }
        ]
    },
    long: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.long.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.long.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.long.actions.long.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.long.actions.long.description',
                img: 'icons/skills/melee/strike-weapon-polearm-ice-blue.webp'
            }
        ]
    },
    lucky: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.lucky.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.lucky.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.lucky.actions.luck.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.lucky.actions.luck.description',
                img: 'icons/magic/control/buff-luck-fortune-green.webp',
                cost: [
                    {
                        key: 'stress',
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.massive.effects.massive.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.massive.effects.massive.description',
                img: 'icons/skills/melee/strike-flail-destructive-yellow.webp',
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.painful.actions.pain.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.painful.actions.pain.description',
                img: 'icons/skills/wounds/injury-face-impact-orange.webp',
                cost: [
                    {
                        key: 'stress',
                        value: 1
                    }
                ]
            }
        ]
    },
    paired: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.paired.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.paired.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.WeaponFeature.paired.effects.paired.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.paired.effects.paired.description',
                img: 'icons/skills/melee/weapons-crossed-swords-yellow-teal.webp',
                changes: [
                    {
                        key: 'system.bonuses.damage.primaryWeapon.bonus',
                        mode: 2,
                        value: 'ITEM.@system.tier + 1'
                    }
                ]
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.parry.actions.parry.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.parry.actions.parry.description',
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.persuasive.actions.persuade.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.persuasive.actions.persuade.description',
                img: 'icons/magic/control/hypnosis-mesmerism-eye.webp',
                target: {
                    type: 'self'
                },
                cost: [
                    {
                        key: 'stress',
                        value: 1
                    }
                ],
                effects: [
                    {
                        name: 'DAGGERHEART.CONFIG.WeaponFeature.persuasive.effects.persuasive.name',
                        description: 'DAGGERHEART.CONFIG.WeaponFeature.persuasive.effects.persuasive.description',
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
        description: 'DAGGERHEART.CONFIG.WeaponFeature.pompous.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.pompous.actions.pompous.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.pompous.actions.pompous.description',
                img: 'icons/magic/control/control-influence-crown-gold.webp'
            }
        ]
    },
    powerful: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.powerful.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.powerful.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.WeaponFeature.powerful.effects.powerful.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.powerful.effects.powerful.description',
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
    },
    protective: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.protective.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.protective.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.WeaponFeature.protective.effects.protective.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.protective.effects.protective.description',
                img: 'icons/skills/melee/shield-block-gray-orange.webp',
                changes: [
                    {
                        key: 'system.armorScore',
                        mode: 2,
                        value: 'ITEM.@system.tier'
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.quick.actions.quick.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.quick.actions.quick.description',
                img: 'icons/skills/movement/arrow-upward-yellow.webp',
                cost: [
                    {
                        key: 'stress',
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.reliable.effects.reliable.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.reliable.effects.reliable.description',
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.reloading.actions.reload.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.reloading.actions.reload.description',
                img: 'icons/weapons/ammunition/shot-round-blue.webp'
            }
        ]
    },
    retractable: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.retractable.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.retractable.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.retractable.actions.retract.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.retractable.actions.retract.description',
                img: 'icons/skills/melee/blade-tip-smoke-green.webp'
            }
        ]
    },
    returning: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.returning.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.returning.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.returning.actions.return.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.returning.actions.return.description',
                img: 'icons/magic/movement/trail-streak-pink.webp'
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.scary.actions.scare.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.scary.actions.scare.description',
                img: 'icons/magic/death/skull-energy-light-purple.webp'
            }
        ]
    },
    selfCorrecting: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.selfCorrecting.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.selfCorrecting.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.WeaponFeature.selfCorrecting.effects.selfCorrecting.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.selfCorrecting.effects.selfCorrecting.description',
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
    serrated: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.serrated.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.serrated.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.WeaponFeature.serrated.effects.serrated.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.serrated.effects.serrated.description',
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.sharpwing.effects.sharpwing.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.sharpwing.effects.sharpwing.description',
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.sheltering.actions.shelter.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.sheltering.actions.shelter.description',
                img: 'icons/skills/melee/shield-block-gray-yellow.webp'
            }
        ]
    },
    startling: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.startling.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.startling.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.startling.actions.startle.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.startling.actions.startle.description',
                img: 'icons/magic/control/fear-fright-mask-orange.webp',
                cost: [
                    {
                        key: 'stress',
                        value: 1
                    }
                ]
            }
        ]
    },
    timebending: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.timebending.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.timebending.description',
        actions: [
            {
                type: 'effect',
                actionType: 'action',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.timebending.actions.bendTime.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.actions.bendTime.description',
                img: 'icons/magic/time/clock-spinning-gold-pink.webp'
            }
        ]
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
    loot: {
        id: 'loot',
        label: 'TYPES.Item.loot'
    },
    beastform: {
        if: 'beastform',
        label: 'TYPES.Item.beastform'
    }
};

export const featureSubTypes = {
    primary: 'primary',
    secondary: 'secondary',
    hope: 'hope',
    class: 'class',
    foundation: 'foundation',
    specialization: 'specialization',
    mastery: 'mastery'
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

export const itemResourceTypes = {
    simple: {
        id: 'simple',
        label: 'DAGGERHEART.CONFIG.ItemResourceType.simple'
    },
    diceValue: {
        id: 'diceValue',
        label: 'DAGGERHEART.CONFIG.ItemResourceType.diceValue'
    }
};

export const itemResourceProgression = {
    increasing: {
        id: 'increasing',
        label: 'DAGGERHEART.CONFIG.ItemResourceProgression.increasing'
    },
    decreasing: {
        id: 'decreasing',
        label: 'DAGGERHEART.CONFIG.ItemResourceProgression.decreasing'
    }
};

export const beastformTypes = {
    normal: {
        id: 'normal',
        label: 'DAGGERHEART.CONFIG.BeastformType.normal'
    },
    evolved: {
        id: 'evolved',
        label: 'DAGGERHEART.CONFIG.BeastformType.evolved'
    },
    hybrid: {
        id: 'hybrid',
        label: 'DAGGERHEART.CONFIG.BeastformType.hybrid'
    }
};
