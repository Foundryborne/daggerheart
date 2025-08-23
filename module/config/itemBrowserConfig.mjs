export const typeConfig = {
    adversaries: {
        columns: [
            {
                key: "system.tier",
                label: "DAGGERHEART.GENERAL.Tiers.singular"
            },
            {
                key: "system.type",
                label: "DAGGERHEART.GENERAL.type"
            }
        ],
        filters: [
            {
                key: "system.tier",
                label: "DAGGERHEART.GENERAL.Tiers.singular",
                field: 'system.api.models.actors.DhAdversary.schema.fields.tier'
            },
            {
                key: "system.type",
                label: "DAGGERHEART.GENERAL.type",
                field: 'system.api.models.actors.DhAdversary.schema.fields.type'
            },
            {
                key: "system.difficulty",
                name: "difficulty.min",
                label: "DAGGERHEART.UI.ItemBrowser.difficultyMin",
                field: 'system.api.models.actors.DhAdversary.schema.fields.difficulty',
                operator: "gte"
            },
            {
                key: "system.difficulty",
                name: "difficulty.max",
                label: "DAGGERHEART.UI.ItemBrowser.difficultyMax",
                field: 'system.api.models.actors.DhAdversary.schema.fields.difficulty',
                operator: "lte"
            },
            {
                key: "system.resources.hitPoints.max",
                name: "hp.min",
                label: "DAGGERHEART.UI.ItemBrowser.hitPointsMin",
                field: 'system.api.models.actors.DhAdversary.schema.fields.resources.fields.hitPoints.fields.max',
                operator: "gte"
            },
            {
                key: "system.resources.hitPoints.max",
                name: "hp.max",
                label: "DAGGERHEART.UI.ItemBrowser.hitPointsMax",
                field: 'system.api.models.actors.DhAdversary.schema.fields.resources.fields.hitPoints.fields.max',
                operator: "lte"
            },
            {
                key: "system.resources.stress.max",
                name: "stress.min",
                label: "DAGGERHEART.UI.ItemBrowser.stressMin",
                field: 'system.api.models.actors.DhAdversary.schema.fields.resources.fields.stress.fields.max',
                operator: "gte"
            },
            {
                key: "system.resources.stress.max",
                name: "stress.max",
                label: "DAGGERHEART.UI.ItemBrowser.stressMax",
                field: 'system.api.models.actors.DhAdversary.schema.fields.resources.fields.stress.fields.max',
                operator: "lte"
            },
        ]
    },
    items: {
        columns: [
            {
                key: "type",
                label: "DAGGERHEART.GENERAL.type"
            },
            {
                key: "system.secondary",
                label: "DAGGERHEART.UI.ItemBrowser.subtype",
                format: (isSecondary) => isSecondary ? "secondary" : (isSecondary === false ? "primary" : '-')
            },
            {
                key: "system.tier",
                label: "DAGGERHEART.GENERAL.Tiers.singular"
            }
        ],
        filters: [
            {
                key: "type",
                label: "DAGGERHEART.GENERAL.type",
                choices: () => CONFIG.Item.documentClass.TYPES.filter(t => ["armor", "weapon", "consumable", "loot"].includes(t)).map(t => ({ value: t, label: t }))
            },
            {
                key: "system.secondary",
                label: "DAGGERHEART.UI.ItemBrowser.subtype",
                choices: [
                    { value: false, label: "DAGGERHEART.ITEMS.Weapon.primaryWeapon" },
                    { value: true, label: "DAGGERHEART.ITEMS.Weapon.secondaryWeapon" }
                ]
            },
            {
                key: "system.tier",
                label: "DAGGERHEART.GENERAL.Tiers.singular",
                choices: [{ value: "1", label: "1" }, { value: "2", label: "2" }, { value: "3", label: "3" }, { value: "4", label: "4" }]
            },
            {
                key: "system.burden",
                label: "DAGGERHEART.GENERAL.burden",
                field: 'system.api.models.items.DHWeapon.schema.fields.burden'
            },
            {
                key: "system.attack.roll.trait",
                label: "DAGGERHEART.GENERAL.Trait.single",
                field: 'system.api.models.actions.actionsTypes.attack.schema.fields.roll.fields.trait'
            },
            {
                key: "system.attack.range",
                label: "DAGGERHEART.GENERAL.range",
                field: 'system.api.models.actions.actionsTypes.attack.schema.fields.range'
            },
            {
                key: "system.baseScore",
                name: "armor.min",
                label: "DAGGERHEART.UI.ItemBrowser.armorScoreMin",
                field: 'system.api.models.items.DHArmor.schema.fields.baseScore',
                operator: "gte"
            },
            {
                key: "system.baseScore",
                name: "armor.max",
                label: "DAGGERHEART.UI.ItemBrowser.armorScoreMax",
                field: 'system.api.models.items.DHArmor.schema.fields.baseScore',
                operator: "lte"
            },
            {
                key: "system.itemFeatures",
                label: "DAGGERHEART.GENERAL.features",
                choices: () => [...Object.entries(CONFIG.DH.ITEM.weaponFeatures), ...Object.entries(CONFIG.DH.ITEM.armorFeatures)].map(([k, v]) => ({ value: k, label: v.label })),
                operator: "contains3"
            }
        ]
    },
    features: {
        columns: [

        ],
        filters: [

        ]
    },
    cards: {
        columns: [
            {
                key: "system.type",
                label: "DAGGERHEART.GENERAL.type"
            },
            {
                key: "system.domain",
                label: "DAGGERHEART.GENERAL.Domain.single"
            },
            {
                key: "system.level",
                label: "DAGGERHEART.GENERAL.level"
            }
        ],
        filters: [
            {
                key: "system.type",
                label: "DAGGERHEART.GENERAL.type",
                field: 'system.api.models.items.DHDomainCard.schema.fields.type'
            },
            {
                key: "system.domain",
                label: "DAGGERHEART.GENERAL.Domain.single",
                field: 'system.api.models.items.DHDomainCard.schema.fields.domain',
                operator: "contains2"
            },
            {
                key: "system.level",
                name: "level.min",
                label: "DAGGERHEART.UI.ItemBrowser.levelMin",
                field: 'system.api.models.items.DHDomainCard.schema.fields.level',
                operator: "gte"
            },
            {
                key: "system.level",
                name: "level.max",
                label: "DAGGERHEART.UI.ItemBrowser.levelMax",
                field: 'system.api.models.items.DHDomainCard.schema.fields.level',
                operator: "lte"
            },
            {
                key: "system.recallCost",
                name: "recall.min",
                label: "DAGGERHEART.UI.ItemBrowser.recallCostMin",
                field: 'system.api.models.items.DHDomainCard.schema.fields.recallCost',
                operator: "gte"
            },
            {
                key: "system.recallCost",
                name: "recall.max",
                label: "DAGGERHEART.UI.ItemBrowser.recallCostMax",
                field: 'system.api.models.items.DHDomainCard.schema.fields.recallCost',
                operator: "lte"
            }
        ]
    },
    classes: {
        columns: [
            {
                key: "system.evasion",
                label: "DAGGERHEART.GENERAL.evasion"
            },
            {
                key: "system.hitPoints",
                label: "DAGGERHEART.GENERAL.HitPoints.plural"
            },
            {
                key: "system.domains",
                label: "DAGGERHEART.GENERAL.Domain.plural"
            }
        ],
        filters: [
            {
                key: "system.evasion",
                name: "evasion.min",
                label: "DAGGERHEART.UI.ItemBrowser.evasionMin",
                field: 'system.api.models.items.DHClass.schema.fields.evasion',
                operator: "gte"
            },
            {
                key: "system.evasion",
                name: "evasion.max",
                label: "DAGGERHEART.UI.ItemBrowser.evasionMax",
                field: 'system.api.models.items.DHClass.schema.fields.evasion',
                operator: "lte"
            },
            {
                key: "system.hitPoints",
                name: "hp.min",
                label: "DAGGERHEART.UI.ItemBrowser.hitPointsMin",
                field: 'system.api.models.items.DHClass.schema.fields.hitPoints',
                operator: "gte"
            },
            {
                key: "system.hitPoints",
                name: "hp.max",
                label: "DAGGERHEART.UI.ItemBrowser.hitPointsMax",
                field: 'system.api.models.items.DHClass.schema.fields.hitPoints',
                operator: "lte"
            },
            {
                key: "system.domains",
                label: "DAGGERHEART.GENERAL.Domain.plural",
                choices: () => Object.values(CONFIG.DH.DOMAIN.domains).map(d => ({ value: d.id, label: d.label })),
                operator: "contains2"
            }
        ]
    },
    subclasses: {
        columns: [
            {
                key: "id",
                label: "TYPES.Item.class",
                format: (id) => {
                    return "";
                }
            },
            {
                key: "system.spellcastingTrait",
                label: "DAGGERHEART.ITEMS.Subclass.spellcastingTrait"
            }
        ],
        filters: []
    },
    beastforms: {
        columns: [
            {
                key: "system.tier",
                label: "DAGGERHEART.GENERAL.Tiers.singular"
            },
            {
                key: "system.mainTrait",
                label: "DAGGERHEART.GENERAL.Trait.single"
            }
        ],
        filters: [
            {
                key: "system.tier",
                label: "DAGGERHEART.GENERAL.Tiers.singular",
                field: 'system.api.models.items.DHBeastform.schema.fields.tier'
            },
            {
                key: "system.mainTrait",
                label: "DAGGERHEART.GENERAL.Trait.single",
                field: 'system.api.models.items.DHBeastform.schema.fields.mainTrait'
            }
        ]
    }
}

export const compendiumConfig = {
    "daggerheart": {
        id: "daggerheart",
        label: "DAGGERHEART",
        folders: {
            "adversaries": {
                id: "adversaries",
                keys: ["adversaries"],
                label: "DAGGERHEART.UI.ItemBrowser.folders.adversaries",
                type: ["adversary"],
                listType: "adversaries"
            },
            "ancestries": {
                id: "ancestries",
                keys: ["ancestries"],
                label: "DAGGERHEART.UI.ItemBrowser.folders.ancestries",
                type: ["ancestry"],
                folders: {
                    "features": {
                        id: "features",
                        keys: ["ancestries"],
                        label: "DAGGERHEART.UI.ItemBrowser.folders.features",
                        type: ["feature"]
                    }
                }
            },
            "equipments": {
                id: "equipments",
                keys: ["armors", "weapons", "consumables", "loot"],
                label: "DAGGERHEART.UI.ItemBrowser.folders.equipment",
                type: ["armor", "weapon", "consumable", "loot"],
                listType: "items"
            },
            "classes": {
                id: "classes",
                keys: ["classes"],
                label: "DAGGERHEART.UI.ItemBrowser.folders.classes",
                type: ["class"],
                folders: {
                    "features": {
                        id: "features",
                        keys: ["classes"],
                        label: "DAGGERHEART.UI.ItemBrowser.folders.features",
                        type: ["feature"]
                    },
                    "items": {
                        id: "items",
                        keys: ["classes"],
                        label: "DAGGERHEART.UI.ItemBrowser.folders.items",
                        type: ["armor", "weapon", "consumable", "loot"],
                        listType: "items"
                    }
                },
                listType: "classes"
            },
            "subclasses": {
                id: "subclasses",
                keys: ["subclasses"],
                label: "DAGGERHEART.UI.ItemBrowser.folders.subclasses",
                type: ["subclass"],
                listType: "subclasses"
            },
            "domains": {
                id: "domains",
                keys: ["domains"],
                label: "DAGGERHEART.UI.ItemBrowser.folders.domainCards",
                type: ["domainCard"],
                listType: "cards"
            },
            "communities": {
                id: "communities",
                keys: ["communities"],
                label: "DAGGERHEART.UI.ItemBrowser.folders.communities",
                type: ["community"],
                folders: {
                    "features": {
                        id: "features",
                        keys: ["communities"],
                        label: "DAGGERHEART.UI.ItemBrowser.folders.features",
                        type: ["feature"]
                    }
                }
            },
            "environments": {
                id: "environments",
                keys: ["environments"],
                label: "DAGGERHEART.UI.ItemBrowser.folders.environments",
                type: ["environment"]
            },
            "beastforms": {
                id: "beastforms",
                keys: ["beastforms"],
                label: "DAGGERHEART.UI.ItemBrowser.folders.beastforms",
                type: ["beastform"],
                listType: "beastforms",
                folders: {
                    "features": {
                        id: "features",
                        keys: ["beastforms"],
                        label: "DAGGERHEART.UI.ItemBrowser.folders.features",
                        type: ["feature"]
                    }
                }
            }
        }
    }
}