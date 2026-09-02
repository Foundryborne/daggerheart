export const armorFeatures = {
    absorbing: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.absorbing.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.absorbing.description',
        actions: [
            {
                type: 'healing',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.ArmorFeature.absorbing.actions.heal.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.absorbing.actions.heal.description',
                img: 'icons/magic/symbols/ring-circle-smoke-blue.webp',
                target: {
                    type: 'self'
                },
                uses: {
                    max: 1,
                    recovery: 'scene',
                    value: 0
                },
                damage: {
                    resources: {
                        armor: {
                            applyTo: 'armor',
                            value: {
                                multiplier: 'flat',
                                flatMultiplier: 0,
                                dice: 'd6',
                                bonus: 1
                            }
                        }
                    }
                }
            }
        ]
    },
    accursed: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.accursed.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.accursed.description',
        actions: [{
            type: 'attack',
            chatDisplay: true,
            name: 'DAGGERHEART.CONFIG.ArmorFeature.accursed.actions.accursed.name',
            description: 'DAGGERHEART.CONFIG.ArmorFeature.accursed.actions.accursed.description',
            img: 'icons/magic/unholy/hand-marked-pink.webp',
            roll: {
                type: 'diceSet',
                diceRolling: {
                    multiplier: 'flat',
                    flatMultiplier: 1,
                    dice: 'd4',
                    compare: 'equal',
                    treshold: 4
                }
            }
        }]
    },
    aquatic: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.aquatic.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.aquatic.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.ArmorFeature.aquatic.effects.aquatic.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.aquatic.effects.aquatic.description',
                img: 'icons/magic/water/orb-water-bubbles-blue.webp',
                system: {       
                    changes: [
                        {
                            key: 'system.advantageSources',
                            type: 'add',
                            value: 'Agility Rolls while submerged'
                        }
                    ]
                }
            }
        ]
    },
    attuned: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.attuned.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.attuned.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.ArmorFeature.attuned.effects.attuned.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.attuned.effects.attuned.description',
                img: 'icons/magic/symbols/rune-sigil-horned-blue.webp',
                system: {       
                    changes: [
                        {
                            key: 'system.damageThresholds.major',
                            type: 'add',
                            value: '@system.tier'
                        },
                        {
                            key: 'system.damageThresholds.severe',
                            type: 'add',
                            value: '@system.tier'
                        },
                        {
                            key: 'system.bonuses.maxLoadout',
                            type: 'subtract',
                            value: 1
                        }
                    ]
                }
            }
        ]
    },
    blessed: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.blessed.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.blessed.description',
        actions: [
            {
                type: 'effect',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.ArmorFeature.blessed.actions.blessed.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.blessed.actions.blessed.description',
                img: 'icons/magic/holy/barrier-shield-winged-cross.webp',
                uses: {
                    max: 1,
                    recovery: 'longRest',
                    value: 0
                }
            }
        ]
    },
    bloodthirsty: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.bloodthirsty.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.bloodthirsty.description',
        actions: [
            {
                type: 'healing',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.ArmorFeature.bloodthirsty.actions.heal.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.bloodthirsty.actions.heal.description',
                img: 'icons/skills/wounds/blood-spurt-spray-red.webp',
                target: {
                    type: 'self'
                },
                damage: {
                    resources: {
                        hitPoints: {
                            applyTo: 'hitPoints',
                            value: {
                                multiplier: 'flat',
                                flatMultiplier: 0,
                                dice: 'd6',
                                bonus: 1
                            }
                        }
                    }
                }
            }
        ]
    },
    bulky: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.bulky.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.bulky.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.ArmorFeature.bulky.effects.bulky.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.bulky.effects.bulky.description',
                img: 'icons/commodities/metal/ingot-stamped-steel.webp',
                system: {       
                    changes: [
                        {
                            key: 'system.evasion',
                            type: 'subtract',
                            value: 1
                        }
                    ]
                }
            }
        ]
    },
    burning: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.burning.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.burning.description',
        actions: [
            {
                type: 'damage',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.ArmorFeature.burning.actions.burn.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.burning.actions.burn.description',
                img: 'icons/magic/fire/flame-burning-embers-yellow.webp',
                range: 'melee',
                target: {
                    type: 'hostile'
                },
                damage: {
                    parts: {
                        stress: {
                            applyTo: 'stress',
                            value: {
                                custom: {
                                    enabled: true,
                                    formula: '1'
                                }
                            }
                        }
                    }
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
                system: {       
                    changes: [
                        {
                            key: 'system.bonuses.roll.spellcast',
                            type: 'add',
                            value: '1'
                        }
                    ]
                }
            }
        ]
    },
    cumbersome: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.cumbersome.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.cumbersome.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.ArmorFeature.cumbersome.effects.cumbersome.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.cumbersome.effects.cumbersome.description',
                img: 'icons/commodities/metal/mail-plate-steel.webp',
                system: {
                    changes: [
                        {
                            key: 'system.traits.finesse.value',
                            type: 'add',
                            value: '-1'
                        }
                    ]
                }
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
                system: {
                    changes: [
                        {
                            key: 'system.traits.agility.value',
                            type: 'add',
                            value: '-1'
                        },
                        {
                            key: 'system.traits.strength.value',
                            type: 'add',
                            value: '-1'
                        },
                        {
                            key: 'system.traits.finesse.value',
                            type: 'add',
                            value: '-1'
                        },
                        {
                            key: 'system.traits.instinct.value',
                            type: 'add',
                            value: '-1'
                        },
                        {
                            key: 'system.traits.presence.value',
                            type: 'add',
                            value: '-1'
                        },
                        {
                            key: 'system.traits.knowledge.value',
                            type: 'add',
                            value: '-1'
                        },
                        {
                            key: 'system.evasion',
                            type: 'add',
                            value: '-1'
                        }
                    ]
                }
            }
        ]
    },
    divine: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.divine.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.divine.description',
        actions: [
            {
                type: 'healing',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.ArmorFeature.divine.actions.heal.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.divine.actions.heal.description',
                img: 'icons/magic/holy/chalice-glowing-yellow-blue.webp',
                target: {
                    type: 'self'
                },
                damage: {
                    resources: {
                        hope: {
                            applyTo: 'hope',
                            value: {
                                multiplier: 'flat',
                                flatMultiplier: 0,
                                dice: 'd6',
                                bonus: 1
                            }
                        }
                    }
                }
            }
        ]
    },
    enchanted: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.enchanted.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.enchanted.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.ArmorFeature.enchanted.effects.enchanted.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.enchanted.effects.enchanted.description',
                img: 'icons/magic/symbols/chevron-elipse-circle-blue.webp',
                system: {
                    changes: [
                        {
                            key: 'system.damageThresholds.major',
                            type: 'add',
                            value: '@cast'
                        },
                        {
                            key: 'system.damageThresholds.severe',
                            type: 'add',
                            value: '@cast'
                        }
                    ]
                }
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
                system: {
                    changes: [
                        {
                            key: 'system.evasion',
                            type: 'add',
                            value: '1'
                        }
                    ]
                }
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
                system: {
                    changes: [
                        {
                            key: 'system.rules.damageReduction.increasePerArmorMark',
                            type: 'override',
                            value: '2'
                        }
                    ]
                }
            }
        ]
    },
    fortuneFavored: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.fortuneFavored.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.fortuneFavored.description',
        actions: [
            {
                type: 'effect',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.ArmorFeature.fortuneFavored.actions.fortuneFavored.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.fortuneFavored.actions.fortuneFavored.description',
                img: 'icons/magic/control/buff-luck-fortune-green-gold.webp',
                uses: {
                    max: 1,
                    recovery: 'scene',
                    value: 0
                }
            }
        ]
    },
    ghostwalker: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.ghostwalker.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.ghostwalker.description',
        actions: [
            {
                type: 'effect',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.ArmorFeature.ghostwalker.actions.ghostwalker.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.ghostwalker.actions.ghostwalker.description',
                img: 'icons/magic/death/undead-ghost-scream-teal.webp',
                uses: {
                    max: 1,
                    recovery: 'shortRest',
                    value: 0
                },
                cost: [{
                    key: 'stress',
                    value: 1
                }]
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
                system: {
                    changes: [
                        {
                            key: 'system.traits.presence.value',
                            type: 'add',
                            value: '1'
                        }
                    ]
                }
            }
        ]
    },
    gliding: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.gliding.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.gliding.description',
        actions: [
            {
                type: 'effect',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.ArmorFeature.gliding.actions.gliding.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.gliding.actions.gliding.description',
                img: 'icons/skills/movement/arrow-upward-yellow.webp'
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
                system: {
                    changes: [
                        {
                            key: 'system.evasion',
                            type: 'add',
                            value: '-1'
                        }
                    ]
                }
            }
        ]
    },
    hopeful: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.hopeful.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.hopeful.description',
        actions: [
            {
                type: 'effect',
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
    lined: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.lined.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.lined.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.ArmorFeature.lined.effects.lined.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.lined.effects.lined.description',
                img: 'icons/magic/defensive/shield-barrier-glowing-triangle-blue-yellow.webp',
                system: {
                    changes: [
                        {
                            key: 'system.rules.damageReduction.stressDamageReduction.minor.cost',
                            type: 'override',
                            value: 1
                        }
                    ]
                }
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
                system: {
                    changes: [
                        {
                            key: 'system.rules.damageReduction.magical',
                            type: 'override',
                            value: 1
                        }
                    ]
                }
            }
        ]
    },
    magnificent: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.magnificent.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.magnificent.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.ArmorFeature.magnificent.effects.magnificent.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.magnificent.effects.magnificent.description',
                img: 'icons/magic/holy/barrier-shield-winged-blue.webp',
                system: {
                    changes: [
                        {
                            type: 'armor',
                            value: {
                                interaction: 'active',
                                max: '@system.traits.presence.value'
                            }
                        }
                    ]
                }
            }
        ]
    },
    mnemonic: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.mnemonic.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.mnemonic.description',
        actions: [
            {
                type: 'effect',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.ArmorFeature.mnemonic.actions.mnemonic.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.mnemonic.actions.mnemonic.description',
                img: 'icons/magic/symbols/circle-ouroboros.webp',
                uses: {
                    max: 1,
                    recovery: 'scene',
                    value: 0
                }
            }
        ]
    },
    painful: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.painful.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.painful.description',
        actions: [
            {
                type: 'effect',
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
                system: {
                    changes: [
                        {
                            key: 'system.rules.damageReduction.physical',
                            type: 'override',
                            value: 1
                        }
                    ]
                }
            }
        ]
    },
    quiet: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.quiet.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.quiet.description',
        actions: [
            {
                type: 'effect',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.ArmorFeature.quiet.actions.quiet.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.quiet.actions.quiet.description',
                img: 'icons/magic/perception/silhouette-stealth-shadow.webp'
            }
        ]
    },
    quickStriding: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.quickStriding.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.quickStriding.description',
        actions: [
            {
                type: 'effect',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.ArmorFeature.quickStriding.actions.quickStriding.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.quickStriding.actions.quickStriding.description',
                img: 'icons/skills/movement/feet-winged-boots-glowing-yellow.webp'
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
                system: {
                    changes: [
                        {
                            key: 'system.bunuses.damageThresholds.major',
                            type: 'add',
                            value: '2'
                        },
                        {
                            key: 'system.bunuses.damageThresholds.severe',
                            type: 'add',
                            value: '2'
                        }
                    ]
                }
            }
        ]
    },
    resilient: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.resilient.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.resilient.description',
        actions: [
            {
                type: 'attack',
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
    resplendent: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.resplendent.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.resplendent.description',
        actions: [
            {
                type: 'healing',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.ArmorFeature.resplendent.actions.heal.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.resplendent.actions.heal.description',
                img: 'icons/magic/light/explosion-star-glow-yellow.webp',
                target: {
                    type: 'self'
                },
                uses: {
                    max: 1,
                    recovery: 'scene',
                    value: 0
                },
                damage: {
                    resources: {
                        armor: {
                            applyTo: 'armor',
                            value: {
                                multiplier: 'flat',
                                flatMultiplier: 0,
                                dice: 'd6',
                                bonus: 1
                            }
                        }
                    }
                }
            }
        ]
    },
    selfHealing: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.selfHealing.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.selfHealing.description',
        actions: [
            {
                type: 'healing',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.ArmorFeature.selfHealing.actions.heal.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.selfHealing.actions.heal.description',
                img: 'icons/magic/life/cross-beam-green.webp',
                target: {
                    type: 'self'
                },
                damage: {
                    resources: {
                        armor: {
                            applyTo: 'armor',
                            value: {
                                multiplier: 'flat',
                                flatMultiplier: 0,
                                dice: 'd6',
                                bonus: 1
                            }
                        }
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
                system: {
                    changes: [
                        {
                            key: 'system.bonuses.damage.primaryWeapon.dice',
                            type: 'add',
                            value: '1d4'
                        },
                        {
                            key: 'system.bonuses.damage.secondaryWeapon.dice',
                            type: 'add',
                            value: '1d4'
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
    stellar: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.stellar.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.stellar.description',
        actions: [
            {
                type: 'effect',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.ArmorFeature.stellar.actions.stellar.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.stellar.actions.stellar.description',
                img: 'icons/magic/light/explosion-star-glow-blue-purple.webp',
                cost: [{
                    key: 'stress',
                    value: 1    
                }]
            }
        ]
    },
    timeslowing: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.timeslowing.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.timeslowing.description',
        actions: [
            {
                type: 'attack',
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
                system: {
                    changes: [
                        {
                            key: 'system.evasion',
                            type: 'add',
                            value: '-2'
                        },
                        {
                            key: 'system.traits.agility.value',
                            type: 'add',
                            value: '-1'
                        }
                    ]
                }
            }
        ]
    },
    vigilant: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.vigilant.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.vigilant.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.ArmorFeature.vigilant.effects.vigilant.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.vigilant.effects.vigilant.description',
                img: 'icons/magic/perception/eye-ringed-green.webp',
                system: {       
                    changes: [
                        {
                            key: 'system.evasion',
                            type: 'add',
                            value: 2
                        }
                    ]
                }
            }
        ]
    },
    vitreous: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.vitreous.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.vitreous.description',
        actions: [
            {
                type: 'effect',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.ArmorFeature.vitreous.actions.vitreous.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.vitreous.actions.vitreous.description',
                img: 'icons/magic/defensive/armor-stone-skin.webp',
                target: {
                    type: 'self'
                },
                cost: [
                    {
                        key: 'armor',
                        value: 2
                    }
                ],
                effects: [
                    {
                        name: 'DAGGERHEART.CONFIG.ArmorFeature.vitreous.effects.vitreous.name',
                        description: 'DAGGERHEART.CONFIG.ArmorFeature.vitreous.effects.vitreous.description',
                        img: 'icons/skills/melee/shield-damaged-broken-blue.webp',
                        system: {
                            stacking: { value: 1 },
                            changes: [
                                {
                                    key: 'system.damageThresholds.major',
                                    type: 'subtract',
                                    value: '@stacks * 5'
                                },
                                {
                                    key: 'system.damageThresholds.severe',
                                    type: 'subtract',
                                    value: '@stacks * 5'
                                }
                            ]
                        }
                    }
                ]
            }
        ]
    },
    wallCrawling: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.wallCrawling.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.wallCrawling.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.ArmorFeature.wallCrawling.effects.wallCrawling.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.wallCrawling.effects.wallCrawling.description',
                img: 'icons/skills/movement/arrow-upward-blue.webp',
                system: {       
                    changes: [
                        {
                            key: 'system.evasion',
                            type: 'add',
                            value: 1
                        }
                    ]
                }
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
                system: {
                    changes: [
                        {
                            key: 'system.resistance.magical.reduction',
                            type: 'add',
                            value: '@system.armorScore.max',
                            priority: 21
                        }
                    ]
                }
            }
        ]
    }
};

export const allArmorFeatures = () => {
    const homebrewFeatures = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).itemFeatures
        .armorFeatures;
    return {
        ...armorFeatures,
        ...Object.keys(homebrewFeatures).reduce((acc, key) => {
            const feature = homebrewFeatures[key];
            const actions = feature.actions.map(action => ({
                ...action,
                effects: action.effects?.map(effect => feature.effects.find(x => x.id === effect._id)) ?? [],
                type: action.type
            }));
            const actionEffects = actions.flatMap(a => a.effects);

            const effects = feature.effects.filter(effect => !actionEffects.some(x => x.id === effect.id));

            acc[key] = { ...feature, label: feature.name, effects, actions };
            return acc;
        }, {})
    };
};

export const orderedArmorFeatures = () => {
    const allFeatures = allArmorFeatures();
    const all = Object.keys(allFeatures).map(key => {
        const feature = allFeatures[key];
        return {
            ...feature,
            id: key,
            label: feature.label ?? feature.name
        };
    });
    return Object.values(all).sort((a, b) => game.i18n.localize(a.label).localeCompare(game.i18n.localize(b.label)));
};

export const weaponFeatures = {
    accelerator: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.accelerator.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.accelerator.description',
        actions: [
            {
                type: 'effect',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.accelerator.actions.accelerator.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.accelerator.actions.accelerator.description',
                img: 'icons/magic/movement/trail-streak-impact-blue.webp',
                target: {
                    type: 'self'
                },
                cost: [
                    {
                        key: 'stress',
                        value: 1
                    }
                ],
                uses: {
                    max: 1,
                    recovery: 'scene',
                    value: 0
                },
                effects: [
                    {
                        name: 'DAGGERHEART.CONFIG.WeaponFeature.accelerator.effects.accelerator.name',
                        description: 'DAGGERHEART.CONFIG.WeaponFeature.accelerator.effects.accelerator.description',
                        img: 'icons/magic/movement/trail-streak-impact-blue.webp',
                        system: {
                            changes: [
                                {
                                    key: 'system.proficiency',
                                    type: 'add',
                                    value: 1
                                }
                            ]
                        }
                    }
                ]
            }
        ]
    },
    aimed: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.aimed.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.aimed.description',
        actions: [
            {
                type: 'effect',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.aimed.actions.aimed.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.aimed.actions.aimed.description',
                img: 'icons/skills/targeting/crosshair-pointed-orange.webp',
                cost: [{
                    key: 'stress',
                    value: 1
                }]
            }
        ]
    },
    barrier: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.barrier.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.barrier.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.WeaponFeature.barrier.effects.barrier.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.barrier.effects.barrier.description',
                img: 'icons/skills/melee/shield-block-bash-blue.webp',
                system: {
                    changes: [
                        {
                            key: 'system.evasion',
                            type: 'add',
                            value: '-1'
                        },
                        {
                            type: 'armor',
                            value: {
                                max: 'ITEM.@system.tier + 1'
                            }
                        }
                    ]
                }
            }
        ]
    },
    bolstering: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.bolstering.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.bolstering.description',
        actions: [
            {
                type: 'healing',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.bolstering.actions.bolstering.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.bolstering.actions.bolstering.description',
                img: 'icons/magic/control/buff-flight-wings-runes-purple-orange.webp',
                damage: {
                    resources: {
                        hope: {
                            applyTo: 'hope',
                            value: {
                                multiplier: 'flat',
                                flatMultiplier: 0,
                                dice: 'd6',
                                bonus: 1
                            }
                        }
                    }
                }
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
                system: {
                    changes: [
                        {
                            key: 'system.bonuses.damage.primaryWeapon.bonus',
                            type: 'add',
                            value: '@system.levelData.level.current'
                        }
                    ]
                }
            }
        ]
    },
    bouncing: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.bouncing.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.bouncing.description',
        actions: [
            {
                type: 'effect',
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
    braced: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.braced.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.braced.description',
        actions: [
            {
                type: 'damage',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.braced.actions.braced.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.braced.actions.braced.description',
                img: 'icons/skills/melee/hand-grip-sword-red.webp',
                cost: [{
                    key: 'stress',
                    value: 2
                }],
                damage: {
                    resources: {
                        hitPoints: {
                            applyTo: 'hitPoints',
                            value: {
                                multiplier: 'flat',
                                flatMultiplier: 0,
                                dice: 'd6',
                                bonus: 2
                            }
                        }
                    }
                }
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
                system: {
                    changes: [
                        {
                            key: 'system.evasion',
                            type: 'add',
                            value: '-1'
                        },
                        {
                            key: 'system.damageThresholds.severe',
                            type: 'add',
                            value: 'ITEM.@system.tier'
                        }
                    ]
                }
            }
        ]
    },
    brutal: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.brutal.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.brutal.description',
        actions: [
            {
                type: 'effect',
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
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.burning.actions.burn.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.burning.actions.burn.description',
                img: 'icons/magic/fire/blast-jet-stream-embers-orange.webp'
            }
        ]
    },
    catalytic: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.catalytic.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.catalytic.description',
        actions: [
            {
                type: 'effect',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.catalytic.actions.catalytic.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.catalytic.actions.catalytic.description',
                img: 'icons/magic/control/sihouette-hold-beam-green.webp',
                effects: [
                    {
                        name: 'DAGGERHEART.CONFIG.WeaponFeature.catalytic.effects.catalytic.name',
                        description: 'DAGGERHEART.CONFIG.WeaponFeature.catalytic.effects.catalytic.description',
                        img: 'icons/magic/control/sihouette-hold-beam-green.webp',
                        system: {
                            changes: [
                                {
                                    key: 'system.bonuses.roll.attack.bonus',
                                    type: 'add',
                                    value: 3
                                }
                            ]
                        }
                    }
                ]
            }
        ]
    },
    charged: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.charged.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.charged.description',
        actions: [
            {
                type: 'effect',
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
                        system: {
                            changes: [
                                {
                                    key: 'system.proficiency',
                                    type: 'add',
                                    value: '1'
                                }
                            ]
                        }
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
                system: {
                    changes: [
                        {
                            key: 'system.traits.finesse.value',
                            type: 'add',
                            value: '-1'
                        }
                    ]
                }
            }
        ]
    },
    deadly: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.deadly.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.deadly.description',
        actions: [
            {
                type: 'effect',
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
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.deflecting.actions.deflect.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.deflecting.actions.deflect.description',
                img: 'icons/skills/melee/hand-grip-sword-strike-orange.webp',
                target: {
                    type: 'self'
                },
                cost: [
                    {
                        key: 'armor',
                        value: 1
                    }
                ],
                effects: [
                    {
                        name: 'DAGGERHEART.CONFIG.WeaponFeature.deflecting.effects.deflecting.name',
                        description: 'DAGGERHEART.CONFIG.WeaponFeature.deflecting.effects.deflecting.description',
                        img: 'icons/skills/melee/hand-grip-sword-strike-orange.webp',
                        system: {
                            changes: [
                                {
                                    key: 'system.evasion',
                                    type: 'add',
                                    value: '@system.armorScore.max',
                                    priority: 21
                                }
                            ]
                        }
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
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.destructive.actions.attack.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.destructive.actions.attack.description',
                img: 'icons/skills/melee/strike-flail-spiked-pink.webp',
                range: 'veryClose',
                target: {
                    type: 'hostile'
                },
                damage: {
                    parts: {
                        stress: {
                            applyTo: 'stress',
                            value: {
                                custom: {
                                    enabled: true,
                                    formula: '1'
                                }
                            }
                        }
                    }
                }
            }
        ],
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.WeaponFeature.destructive.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.destructive.effects.agility',
                img: 'icons/skills/melee/strike-flail-spiked-pink.webp',
                system: {
                    changes: [
                        {
                            key: 'system.traits.agility.value',
                            type: 'add',
                            value: '-1'
                        }
                    ]
                }
            }
        ]
    },
    devastating: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.devastating.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.devastating.description',
        actions: [
            {
                type: 'effect',
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
    disturbing: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.disturbing.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.disturbing.description',
        actions: [
            {
                type: 'damage',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.disturbing.actions.disturbing.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.disturbing.actions.disturbing.description',
                img: 'icons/magic/death/skull-energy-light-white.webp',
                damage: {
                    resources: {
                        stress: {
                            applyTo: 'stress',
                            value: {
                                multiplier: 'flat',
                                flatMultiplier: 0,
                                dice: 'd6',
                                bonus: 1
                            }
                        }
                    }
                }
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
                system: {
                    changes: [
                        {
                            key: 'system.bonuses.damage.primaryWeapon.bonus',
                            type: 'add',
                            value: '1'
                        }
                    ],
                    rangeDependence: {
                        enabled: true,
                        range: 'melee',
                        target: 'hostile',
                        type: 'withinRange'
                    }
                }
            },
            {
                name: 'DAGGERHEART.CONFIG.WeaponFeature.doubleDuty.effects.doubleDuty.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.doubleDuty.effects.doubleDuty.description',
                img: 'icons/skills/melee/sword-shield-stylized-white.webp',
                changes: [
                    {
                        type: 'armor',
                        value: {
                            max: 1
                        }
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
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.doubledUp.actions.doubleUp.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.doubledUp.actions.doubleUp.description',
                img: 'icons/skills/melee/strike-slashes-orange.webp'
            }
        ]
    },
    draining: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.draining.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.draining.description',
        actions: [
            {
                type: 'damage',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.draining.actions.draining.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.draining.actions.draining.description',
                img: 'icons/magic/unholy/hand-light-green.webp',
                damage: {
                    resources: {
                        stress: {
                            applyTo: 'stress',
                            value: {
                                multiplier: 'flat',
                                flatMultiplier: 0,
                                dice: 'd6',
                                bonus: 1
                            }
                        }
                    }
                }
            }
        ]
    },
    dueling: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.dueling.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.dueling.description',
        actions: [
            {
                type: 'effect',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.dueling.actions.duel.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.dueling.actions.duel.description',
                img: 'icons/skills/melee/weapons-crossed-swords-pink.webp'
            }
        ]
    },
    entangling: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.entangling.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.entangling.description',
        actions: [
            {
                type: 'effect',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.entangling.actions.entangling.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.entangling.actions.entangling.description',
                img: 'icons/magic/nature/root-vine-entangle-foot-green.webp',
                target: {
                    type: 'self'
                },
                cost: [
                    {
                        key: 'hope',
                        value: 1
                    }
                ],
                effects: [
                    {
                        name: 'DAGGERHEART.CONFIG.WeaponFeature.entangling.effects.entangling.name',
                        description: 'DAGGERHEART.CONFIG.WeaponFeature.entangling.effects.entangling.description',
                        img: 'icons/magic/nature/root-vine-entangle-foot-green.webp',
                        statuses: ['vulnerable']
                    }
                ]
            }
        ]
    },
    eruptive: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.eruptive.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.eruptive.description',
        actions: [
            {
                type: 'effect', // Should prompt a dc 14 reaction save on adversaries
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.eruptive.actions.erupt.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.eruptive.actions.erupt.description',
                img: 'icons/skills/melee/strike-hammer-destructive-blue.webp'
            }
        ]
    },
    ethereal: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.ethereal.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.ethereal.description',
        actions: [
            {
                type: 'effect',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.ethereal.actions.ethereal.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.ethereal.actions.ethereal.description',
                img: 'icons/weapons/swords/sword-broad-serrated-blue.webp',
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
                        name: 'DAGGERHEART.CONFIG.WeaponFeature.ethereal.effects.ethereal.name',
                        description: 'DAGGERHEART.CONFIG.WeaponFeature.ethereal.effects.ethereal.description',
                        img: 'icons/weapons/swords/sword-broad-serrated-blue.webp',
                        system: {
                            duration: {
                                type: 'scene'
                            }
                        }
                    }
                ]
            }
        ]
    },
    extending: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.extending.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.extending.description'
    },
    focused: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.focused.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.focused.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.WeaponFeature.focused.effects.focused.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.focused.effects.focused.description',
                img: 'icons/magic/light/orb-shadow-blue.webp',
                system: {
                    changes: [
                        {
                            key: 'system.bonuses.damage.primaryWeapon.bonus',
                            type: 'add',
                            value: 1
                        }
                    ],
                    rangeDependence: {
                        enabled: true,
                        range: 'veryClose',
                        target: 'hostile',
                        type: 'withinRange'
                    }
                }
            }
        ]
    },
    followUp: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.followUp.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.followUp.description',
        actions: [
            {
                type: 'effect',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.followUp.actions.followUp.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.followUp.actions.followUp.description',
                img: 'icons/skills/melee/strike-sword-steel-yellow.webp',
                target: {
                    type: 'self'
                },
                cost: [{
                    key: 'stress',
                    value: 1
                }],
                effects: [
                    {
                        name: 'DAGGERHEART.CONFIG.WeaponFeature.followUp.effects.followUp.name',
                        description: 'DAGGERHEART.CONFIG.WeaponFeature.followUp.effects.followUp.description',
                        img: 'icons/skills/melee/strike-sword-steel-yellow.webp',
                        system: {
                            changes: [
                                {
                                    key: 'system.proficiency',
                                    type: 'add',
                                    value: '1'
                                }
                            ]
                        }
                    }
                ]
            }
        ]
    },
    freezing: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.freezing.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.freezing.description',
        actions: [
            {
                type: 'effect',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.freezing.actions.freezing.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.freezing.actions.freezing.description',
                img: 'icons/magic/water/barrier-ice-crystal-wall-faceted.webp',
                effects: [
                    {
                        name: 'DAGGERHEART.CONFIG.WeaponFeature.freezing.effects.freezing.name',
                        description: 'DAGGERHEART.CONFIG.WeaponFeature.freezing.effects.freezing.description',
                        img: 'icons/magic/water/barrier-ice-crystal-wall-faceted.webp',
                        statuses: ['restrained']
                    }
                ]
            }
        ]
    },
    grappling: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.grappling.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.grappling.description',
        actions: [
            {
                type: 'effect',
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
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.greedy.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.greedy.description',
                img: 'icons/commodities/currency/coins-crown-stack-gold.webp',
                target: {
                    type: 'self'
                },
                // Should cost handful of gold,
                effects: [
                    {
                        name: 'DAGGERHEART.CONFIG.WeaponFeature.greedy.actions.greed.name',
                        description: 'DAGGERHEART.CONFIG.WeaponFeature.greedy.actions.greed.description',
                        img: 'icons/commodities/currency/coins-crown-stack-gold.webp',
                        system: {
                            changes: [
                                {
                                    key: 'system.proficiency',
                                    type: 'add',
                                    value: '1'
                                }
                            ]
                        }
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
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.healing.actions.heal.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.healing.actions.heal.description',
                img: 'icons/magic/life/cross-beam-green.webp',
                target: {
                    type: 'self'
                },
                damage: {
                    parts: {
                        hitPoints: {
                            applyTo: 'hitPoints',
                            value: {
                                custom: {
                                    enabled: true,
                                    formula: 1
                                }
                            }
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
                name: 'DAGGERHEART.CONFIG.WeaponFeature.heavy.effects.heavy.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.heavy.effects.heavy.description',
                img: 'icons/commodities/metal/ingot-worn-iron.webp',
                system: {
                    changes: [
                        {
                            key: 'system.evasion',
                            type: 'add',
                            value: '-1'
                        }
                    ]
                }
            }
        ]
    },
    hooked: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.hooked.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.hooked.description',
        actions: [
            {
                type: 'effect',
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
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.hot.actions.hot.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.hot.actions.hot.description',
                img: 'icons/magic/fire/dagger-rune-enchant-flame-red.webp'
            }
        ]
    },
    incendiary: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.incendiary.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.incendiary.description',
        actions: [
            {
                type: 'damage',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.incendiary.actions.incendiary.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.incendiary.actions.incendiary.description',
                img: 'icons/magic/fire/explosion-fireball-large-orange.webp',
                areas: [{
                    name: 'DAGGERHEART.CONFIG.WeaponFeature.incendiary.name',
                    type: 'placed',
                    shape: 'emanation',
                    size: 'veryClose'
                }],
                damage: {
                    resources: {
                        hitPoints: {
                            applyTo: 'hitPoints',
                            value: {
                                multiplier: 'flat',
                                flatMultiplier: 0,
                                dice: 'd6',
                                bonus: 1
                            }
                        }
                    }
                }
            }
        ],
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.WeaponFeature.incendiary.effects.incendiary.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.incendiary.effects.incendiary.description',
                img: 'icons/commodities/metal/ingot-stamped-steel.webp',
                system: {
                    changes: [
                        {
                            key: 'system.traits.agility.value',
                            type: 'subtract',
                            value: 1
                        }
                    ]
                }
            }
        ]
    },
    invigorating: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.invigorating.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.invigorating.description',
        actions: [
            {
                type: 'effect',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.invigorating.actions.invigorate.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.invigorating.actions.invigorate.description',
                img: 'icons/magic/life/heart-cross-green.webp'
            }
        ]
    },
    inverted: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.inverted.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.inverted.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.WeaponFeature.inverted.effects.inverted.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.inverted.effects.inverted.description',
                img: 'icons/magic/symbols/runes-carved-stone-yellow.webp'
            }
        ]
    },
    lifestealing: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.lifestealing.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.lifestealing.description',
        actions: [
            {
                type: 'effect',
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
    magnetic: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.magnetic.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.magnetic.description',
        actions: [
            {
                type: 'attack',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.magnetic.actions.magnetic.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.magnetic.actions.magnetic.description',
                img: 'icons/magic/movement/portal-vortex-orange.webp',
                cost: [{
                    key: 'hope',
                    value: 1
                }],
                areas: [{
                    name: 'DAGGERHEART.CONFIG.WeaponFeature.magnetic.name',
                    type: 'placed',
                    shape: 'emanation',
                    size: 'veryClose'
                }],
                damage: {
                    resources: {
                        stress: {
                            applyTo: 'stress',
                            value: {
                                dice: 'd6',
                                flatMultiplier: 0,
                                multiplier: 'flat',
                                bonus: 1
                            }
                        }
                    }
                },
                save: {
                    trait: 'agility',
                    difficulty: 16,
                    damageMod: 'none'
                }
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
                system: {
                    changes: [
                        {
                            key: 'system.evasion',
                            type: 'add',
                            value: '-1'
                        }
                    ]
                }
            }
        ]
    },
    nonlethal: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.nonlethal.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.nonlethal.description'
    },
    omnipresent: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.omnipresent.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.omnipresent.description'
    },
    padded: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.padded.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.padded.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.WeaponFeature.padded.effects.padded.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.padded.effects.padded.description',
                img: 'icons/commodities/cloth/cloth-patterned-teal.webp',
                system: {
                    changes: [
                        {
                            key: 'system.damageThresholds.major',
                            type: 'add',
                            value: '1 + @system.tier'
                        },
                        {
                            key: 'system.damageThresholds.severe',
                            type: 'add',
                            value: '1 + @system.tier'
                        }
                    ]
                }
            }
        ]
    },
    painful: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.painful.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.painful.description',
        actions: [
            {
                type: 'effect',
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
                system: {
                    changes: [
                        {
                            key: 'system.bonuses.damage.primaryWeapon.bonus',
                            type: 'add',
                            value: 'ITEM.@system.tier + 1'
                        }
                    ],
                    rangeDependence: {
                        enabled: true,
                        range: 'melee',
                        target: 'hostile',
                        type: 'withinRange'
                    }
                }
            }
        ]
    },
    parry: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.parry.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.parry.description',
        actions: [
            {
                type: 'effect',
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
                        system: {
                            changes: [
                                {
                                    key: 'system.traits.presence.value',
                                    type: 'add',
                                    value: '2'
                                }
                            ]
                        }
                    }
                ]
            }
        ]
    },
    poisonous: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.poisonous.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.poisonous.description' 
    },
    pompous: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.pompous.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.pompous.description',
        actions: [
            {
                type: 'effect',
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
                changes: []
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
                system: {
                    changes: [
                        {
                            type: 'armor',
                            value: {
                                max: 'ITEM.@system.tier'
                            }
                        }
                    ]
                }

            }
        ]
    },
    quick: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.quick.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.quick.description',
        actions: [
            {
                type: 'effect',
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
    rebounding: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.rebounding.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.rebounding.description'
    },
    recursive: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.recursive.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.recursive.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.WeaponFeature.recursive.effects.recursive.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.recursive.effects.recursive.description',
                img: 'icons/magic/light/beam-deflect-path-yellow.webp'
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
                system: {
                    changes: [
                        {
                            key: 'system.bonuses.roll.primaryWeapon.bonus',
                            type: 'add',
                            value: 1
                        }
                    ]
                }
            }
        ]
    },
    reloading: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.reloading.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.reloading.description',
        actions: [
            {
                type: 'effect',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.reloading.actions.reload.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.reloading.actions.reload.description',
                img: 'icons/weapons/ammunition/shot-round-blue.webp'
            }
        ],
        getErrorText: item => {
            if (!item.system.resource?.max)
                return _loc('DAGGERHEART.CONFIG.WeaponFeature.reloading.errors.missingResource');

            return null;
        }
    },
    retractable: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.retractable.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.retractable.description'
    },
    returning: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.returning.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.returning.description',
        actions: [
            {
                type: 'effect',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.returning.actions.return.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.returning.actions.return.description',
                img: 'icons/magic/movement/trail-streak-pink.webp'
            }
        ]
    },
    ricochet: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.ricochet.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.ricochet.description',
        actions: [
            {
                type: 'effect',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.ricochet.actions.ricochet.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.ricochet.actions.ricochet.description',
                img: 'icons/magic/light/beam-impact-deflect-teal.webp',
                cost: [{
                    key: 'stress',
                    value: 1
                }]
            }
        ]
    },
    scary: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.scary.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.scary.description',
        actions: [
            {
                type: 'effect',
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
                changes: []
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
                changes: []
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
                        type: 'add',
                        value: '@system.traits.agility.value',
                        priority: 21
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
    stockpiled: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.stockpiled.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.stockpiled.description'
    },
    targeted: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.targeted.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.targeted.description',
        actions: [
            {
                type: 'effect',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.targeted.actions.targeted.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.targeted.actions.targeted.description',
                img: 'icons/skills/targeting/crosshair-arrowhead-blue.webp',
                costs: [{
                    key: 'hope',
                    value: 1
                }]
            }
        ]
    },
    timebending: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.timebending.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.timebending.description',
        actions: [
            {
                type: 'effect',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.timebending.actions.bendTime.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.timebending.actions.bendTime.description',
                img: 'icons/magic/time/clock-spinning-gold-pink.webp'
            }
        ]
    },
    trusty: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.trusty.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.trusty.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.WeaponFeature.trusty.effects.trusty.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.trusty.effects.trusty.description',
                img: 'icons/skills/melee/sword-twirl-orange.webp',
                changes: [
                    {
                        key: 'system.bonuses.roll.primaryWeapon.bonus',
                        type: 'add',
                        value: 1
                    }
                ]
            }
        ]
    },
    venomous: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.venomous.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.venomous.description',
        actions: [
            {
                type: 'effect',
                chatDisplay: true,
                name: 'DAGGERHEART.CONFIG.WeaponFeature.venomous.actions.venomous.name',
                description: 'DAGGERHEART.CONFIG.WeaponFeature.venomous.actions.venomous.description',
                img: 'icons/skills/toxins/symbol-poison-drop-skull-green.webp',
                effects: [
                    {
                        name: 'DAGGERHEART.CONFIG.WeaponFeature.venomous.effects.venomous.name',
                        description: 'DAGGERHEART.CONFIG.WeaponFeature.venomous.effects.venomous.description',
                        img: 'icons/skills/toxins/symbol-poison-drop-skull-green.webp',
                        statuses: ['vulnerable']
                    }
                ]
            }
        ]
    },
    vitreous: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.vitreous.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.vitreous.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.ArmorFeature.vitreous.effects.vitreous.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.vitreous.effects.vitreous.description',
                img: 'icons/magic/defensive/armor-stone-skin.webp',
                system: {       
                    changes: [
                        {
                            key: 'system.rules.damageReduction.fullNegateArmor',
                            type: 'override',
                            value: 2
                        }
                    ]
                }
            }
        ]
    },
    volleyed: {
        label: 'DAGGERHEART.CONFIG.WeaponFeature.volleyed.name',
        description: 'DAGGERHEART.CONFIG.WeaponFeature.volleyed.description'
    },
    wallCrawling: {
        label: 'DAGGERHEART.CONFIG.ArmorFeature.wallCrawling.name',
        description: 'DAGGERHEART.CONFIG.ArmorFeature.wallCrawling.description',
        effects: [
            {
                name: 'DAGGERHEART.CONFIG.ArmorFeature.wallCrawling.effects.wallCrawling.name',
                description: 'DAGGERHEART.CONFIG.ArmorFeature.wallCrawling.effects.wallCrawling.description',
                img: 'icons/skills/movement/arrow-upward-blue.webp',
                system: {       
                    changes: [
                        {
                            key: 'system.evasion',
                            type: 'add',
                            value: 1
                        }
                    ]
                }
            }
        ]
    }
};

export const allWeaponFeatures = () => {
    const homebrewFeatures = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).itemFeatures
        .weaponFeatures;

    return {
        ...weaponFeatures,
        ...Object.keys(homebrewFeatures).reduce((acc, key) => {
            const feature = homebrewFeatures[key];

            const actions = feature.actions.map(action => ({
                ...action,
                effects: action.effects?.map(effect => feature.effects.find(x => x.id === effect._id)) ?? [],
                type: action.type
            }));
            const actionEffects = actions.flatMap(a => a.effects);
            const effects = feature.effects.filter(effect => !actionEffects.some(x => x.id === effect.id));

            acc[key] = { ...feature, label: feature.name, effects, actions };
            return acc;
        }, {})
    };
};

export const orderedWeaponFeatures = () => {
    const allFeatures = allWeaponFeatures();
    const all = Object.keys(allFeatures).map(key => {
        const feature = allFeatures[key];
        return {
            ...feature,
            id: key,
            label: feature.label ?? feature.name
        };
    });
    return Object.values(all).sort((a, b) => game.i18n.localize(a.label).localeCompare(game.i18n.localize(b.label)));
};

export const featureForm = {
    passive: 'DAGGERHEART.CONFIG.FeatureForm.passive',
    action: 'DAGGERHEART.CONFIG.FeatureForm.action',
    reaction: 'DAGGERHEART.CONFIG.FeatureForm.reaction',
    evolution: 'DAGGERHEART.CONFIG.FeatureForm.evolution'
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
    },
    transformation: {
        id: 'transformation',
        label: 'TYPES.Item.transformation'
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

export const itemResourceTypes = {
    simple: {
        id: 'simple',
        label: 'DAGGERHEART.CONFIG.ItemResourceType.simple'
    },
    diceValue: {
        id: 'diceValue',
        label: 'DAGGERHEART.CONFIG.ItemResourceType.diceValue'
    },
    die: {
        id: 'die',
        label: 'DAGGERHEART.CONFIG.ItemResourceType.die'
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

export const originItemType = {
    itemCollection: 'itemCollection',
    restMove: 'restMove'
};

export const evolutionRelationships = {
    active: { id: 'active', label: 'DAGGERHEART.CONFIG.evolutionRelationship.active' },
    
    inactive: { id: 'inactive', label: 'DAGGERHEART.CONFIG.evolutionRelationship.inactive' }
};