export const typeConfig = {
    adversaries: {
        columns: [
            {
                key: "system.tier",
                label: "Tier"
            },
            {
                key: "system.type",
                label: "Type"
            }
        ],
        filters: [
            {
                key: "system.tier",
                label: "Tier",
                field: 'system.api.models.actors.DhAdversary.schema.fields.tier'
            },
            {
                key: "system.type",
                label: "Type",
                field: 'system.api.models.actors.DhAdversary.schema.fields.type'
            },
            {
                key: "system.difficulty",
                name: "difficulty.min",
                label: "Difficulty (Min)",
                field: 'system.api.models.actors.DhAdversary.schema.fields.difficulty',
                operator: "gte"
            },
            {
                key: "system.difficulty",
                name: "difficulty.max",
                label: "Difficulty (Max)",
                field: 'system.api.models.actors.DhAdversary.schema.fields.difficulty',
                operator: "lte"
            },
            {
                key: "system.resources.hitPoints.max",
                name: "hp.min",
                label: "Hit Points (Min)",
                field: 'system.api.models.actors.DhAdversary.schema.fields.resources.fields.hitPoints.fields.max',
                operator: "gte"
            },
            {
                key: "system.resources.hitPoints.max",
                name: "hp.max",
                label: "Hit Points (Max)",
                field: 'system.api.models.actors.DhAdversary.schema.fields.resources.fields.hitPoints.fields.max',
                operator: "lte"
            },
            {
                key: "system.resources.stress.max",
                name: "stress.min",
                label: "Stress (Min)",
                field: 'system.api.models.actors.DhAdversary.schema.fields.resources.fields.stress.fields.max',
                operator: "gte"
            },
            {
                key: "system.resources.stress.max",
                name: "stress.max",
                label: "Stress (Max)",
                field: 'system.api.models.actors.DhAdversary.schema.fields.resources.fields.stress.fields.max',
                operator: "lte"
            },
        ]
    },
    items: {
        columns: [
            {
                key: "type",
                label: "Type"
            },
            {
                key: "system.secondary",
                label: "Subtype",
                format: (isSecondary) => isSecondary ? "secondary" : (isSecondary === false ? "primary" : '-')
            },
            {
                key: "system.tier",
                label: "Tier"
            }
        ],
        filters: [
            {
                key: "type",
                label: "Type",
                choices: () => CONFIG.Item.documentClass.TYPES.filter(t => ["armor", "weapon", "consumable", "loot"].includes(t)).map(t => ({ value: t, label: t }))
            },
            {
                key: "system.secondary",
                label: "Subtype",
                choices: [
                    { value: false, label: "Primary Weapon"},
                    { value: true, label: "Secondary Weapon"}
                ]
            },
            {
                key: "system.tier",
                label: "Tier",
                choices: [{ value: "1", label: "1"}, { value: "2", label: "2"}, { value: "3", label: "3"}, { value: "4", label: "4"}]
            },
            {
                key: "system.burden",
                label: "Burden",
                field: 'system.api.models.items.DHWeapon.schema.fields.burden'
            },
            {
                key: "system.attack.roll.trait",
                label: "Trait",
                field: 'system.api.models.actions.actionsTypes.attack.schema.fields.roll.fields.trait'
            },
            {
                key: "system.attack.range",
                label: "Range",
                field: 'system.api.models.actions.actionsTypes.attack.schema.fields.range'
            },
            {
                key: "system.baseScore",
                name: "armor.min",
                label: "Armor Score (Min)",
                field: 'system.api.models.items.DHArmor.schema.fields.baseScore',
                operator: "gte"
            },
            {
                key: "system.baseScore",
                name: "armor.max",
                label: "Armor Score (Max)",
                field: 'system.api.models.items.DHArmor.schema.fields.baseScore',
                operator: "lte"
            },
            {
                key: "system.itemFeatures",
                label: "Features",
                choices: () => [...Object.entries(CONFIG.DH.ITEM.weaponFeatures), ...Object.entries(CONFIG.DH.ITEM.armorFeatures)].map(([k,v]) => ({ value: k, label: v.label})),
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
                label: "Type"
            },
            {
                key: "system.domain",
                label: "Domain"
            },
            {
                key: "system.level",
                label: "Level"
            }
        ],
        filters: [
            {
                key: "system.type",
                label: "Type",
                field: 'system.api.models.items.DHDomainCard.schema.fields.type'
            },
            {
                key: "system.domain",
                label: "Domain",
                field: 'system.api.models.items.DHDomainCard.schema.fields.domain',
                operator: "contains2"
            },
            {
                key: "system.level",
                name: "level.min",
                label: "Level (Min)",
                field: 'system.api.models.items.DHDomainCard.schema.fields.level',
                operator: "gte"
            },
            {
                key: "system.level",
                name: "level.max",
                label: "Level (Max)",
                field: 'system.api.models.items.DHDomainCard.schema.fields.level',
                operator: "lte"
            },
            {
                key: "system.recallCost",
                name: "recall.min",
                label: "Recall Cost (Min)",
                field: 'system.api.models.items.DHDomainCard.schema.fields.recallCost',
                operator: "gte"
            },
            {
                key: "system.recallCost",
                name: "recall.max",
                label: "Recall Cost (Max)",
                field: 'system.api.models.items.DHDomainCard.schema.fields.recallCost',
                operator: "lte"
            }
        ]
    },
    classes: {
        columns: [
            {
                key: "system.evasion",
                label: "Evasion"
            },
            {
                key: "system.hitPoints",
                label: "Hit Points"
            },
            {
                key: "system.domains",
                label: "Domains"
            }
        ],
        filters: [
            {
                key: "system.evasion",
                name: "evasion.min",
                label: "Evasion (Min)",
                field: 'system.api.models.items.DHClass.schema.fields.evasion',
                operator: "gte"
            },
            {
                key: "system.evasion",
                name: "evasion.max",
                label: "Evasion (Max)",
                field: 'system.api.models.items.DHClass.schema.fields.evasion',
                operator: "lte"
            },
            {
                key: "system.hitPoints",
                name: "hp.min",
                label: "Hit Points (Min)",
                field: 'system.api.models.items.DHClass.schema.fields.hitPoints',
                operator: "gte"
            },
            {
                key: "system.hitPoints",
                name: "hp.max",
                label: "Hit Points (Max)",
                field: 'system.api.models.items.DHClass.schema.fields.hitPoints',
                operator: "lte"
            },
            {
                key: "system.domains",
                label: "Domains",
                choices: () => Object.values(CONFIG.DH.DOMAIN.domains).map(d => ({ value: d.id, label: d.label})),
                operator: "contains2"
            }
        ]
    },
    subclasses: {
        columns: [
            {
                key: "id",
                label: "Class",
                format: (id) => {
                    return "";
                }
            },
            {
                key: "system.spellcastingTrait",
                label: "Spellcasting Trait"
            }
        ],
        filters: []
    },
    beastforms: {
        columns: [
            {
                key: "system.tier",
                label: "Tier"
            },
            {
                key: "system.mainTrait",
                label: "Main Trait"
            }
        ],
        filters: [
            {
                key: "system.tier",
                label: "Tier",
                field: 'system.api.models.items.DHBeastform.schema.fields.tier'
            },
            {
                key: "system.mainTrait",
                label: "Main Trait",
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
                label: "Adversaries",
                type: ["adversary"],
                listType: "adversaries"
            },
            "ancestries": {
                id: "ancestries",
                keys: ["ancestries"],
                label: "Ancestries",
                type: ["ancestry"],
                folders: {
                    "features": {
                        id: "features",
                        keys: ["ancestries"],
                        label: "Features",
                        type: ["feature"]
                    }
                }
            },
            "equipments": {
                id: "equipments",
                keys: ["armors", "weapons", "consumables", "loot"],
                label: "Equipment",
                type: ["armor", "weapon", "consumable", "loot"],
                listType: "items"
            },
            "classes": {
                id: "classes",
                keys: ["classes"],
                label: "Classes",
                type: ["class"],
                folders: {
                    "features": {
                        id: "features",
                        keys: ["classes"],
                        label: "Features",
                        type: ["feature"]
                    },
                    "items": {
                        id: "items",
                        keys: ["classes"],
                        label: "Items",
                        type: ["armor", "weapon", "consumable", "loot"],
                        listType: "items"
                    }
                },
                listType: "classes"
            },
            "subclasses": {
                id: "subclasses",
                keys: ["subclasses"],
                label: "Subclasses",
                type: ["subclass"],
                listType: "subclasses"
            },
            "domains": {
                id: "domains",
                keys: ["domains"],
                label: "Domain Cards",
                type: ["domainCard"],
                listType: "cards"
            },
            "communities": {
                id: "communities",
                keys: ["communities"],
                label: "Communities",
                type: ["community"],
                folders: {
                    "features": {
                        id: "features",
                        keys: ["communities"],
                        label: "Features",
                        type: ["feature"]
                    }
                }
            },
            "environments": {
                id: "environments",
                keys: ["environments"],
                label: "Environments",
                type: ["environment"]
            },
            "beastforms": {
                id: "beastforms",
                keys: ["beastforms"],
                label: "Beastforms",
                type: ["beastform"],
                listType: "beastforms",
                folders: {
                    "features": {
                        id: "features",
                        keys: ["beastforms"],
                        label: "Features",
                        type: ["feature"]
                    }
                }
            }
        }
    }
}