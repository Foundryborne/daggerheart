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
                label: "Difficulty (Min)",
                field: 'system.api.models.actors.DhAdversary.schema.fields.difficulty',
                operator: "gte"
            },
            {
                key: "system.difficulty",
                label: "Difficulty (Max)",
                field: 'system.api.models.actors.DhAdversary.schema.fields.difficulty',
                operator: "lte"
            },
            {
                key: "system.resources.hitPoints.max",
                label: "Hit Points (Min)",
                field: 'system.api.models.actors.DhAdversary.schema.fields.resources.fields.hitPoints.fields.max',
                operator: "gte"
            },
            {
                key: "system.resources.hitPoints.max",
                label: "Hit Points (Max)",
                field: 'system.api.models.actors.DhAdversary.schema.fields.resources.fields.hitPoints.fields.max',
                operator: "lte"
            },
            {
                key: "system.resources.stress.max",
                label: "Stress (Min)",
                field: 'system.api.models.actors.DhAdversary.schema.fields.resources.fields.stress.fields.max',
                operator: "gte"
            },
            {
                key: "system.resources.stress.max",
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
                label: "Armor Score (Min)",
                field: 'system.api.models.items.DHArmor.schema.fields.baseScore',
                operator: "gte"
            },
            {
                key: "system.baseScore",
                label: "Armor Score (Max)",
                field: 'system.api.models.items.DHArmor.schema.fields.baseScore',
                operator: "lte"
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

        ],
        filters: [
            
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
                        label: "Difficulty (Min)",
                        field: 'system.api.models.actors.DhAdversary.schema.fields.difficulty',
                        operator: "gte"
                    },
                    {
                        key: "system.difficulty",
                        label: "Difficulty (Max)",
                        field: 'system.api.models.actors.DhAdversary.schema.fields.difficulty',
                        operator: "lte"
                    },
                    {
                        key: "system.resources.hitPoints.max",
                        label: "Hit Points (Min)",
                        field: 'system.api.models.actors.DhAdversary.schema.fields.resources.fields.hitPoints.fields.max',
                        operator: "gte"
                    },
                    {
                        key: "system.resources.hitPoints.max",
                        label: "Hit Points (Max)",
                        field: 'system.api.models.actors.DhAdversary.schema.fields.resources.fields.hitPoints.fields.max',
                        operator: "lte"
                    },
                    {
                        key: "system.resources.stress.max",
                        label: "Stress (Min)",
                        field: 'system.api.models.actors.DhAdversary.schema.fields.resources.fields.stress.fields.max',
                        operator: "gte"
                    },
                    {
                        key: "system.resources.stress.max",
                        label: "Stress (Max)",
                        field: 'system.api.models.actors.DhAdversary.schema.fields.resources.fields.stress.fields.max',
                        operator: "lte"
                    },
                ]
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
                label: "Equipments",
                type: ["armor", "weapon", "consumable", "loot"],
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
                        // filtered: ["armor", "weapon", "consumable", "loot"],
                        // field: 'system.api.documents.DHItem.schema.fields.type',
                        // valueAttr: 'label'
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
                        label: "Armor Score (Min)",
                        field: 'system.api.models.items.DHArmor.schema.fields.baseScore',
                        operator: "gte"
                    },
                    {
                        key: "system.baseScore",
                        label: "Armor Score (Max)",
                        field: 'system.api.models.items.DHArmor.schema.fields.baseScore',
                        operator: "lte"
                    }
                ]
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
                        type: ["armor", "weapon", "consumable", "loot"]
                    }
                }
            },
            "subclasses": {
                id: "subclasses",
                keys: ["subclasses"],
                label: "Subclasses",
                type: ["subclass"],
                folders: {
                    "features": {
                        id: "features",
                        keys: ["subclasses"],
                        label: "Features",
                        type: ["feature"]
                    }
                }
            },
            "domains": {
                id: "domains",
                keys: ["domains"],
                label: "Domain Cards",
                type: ["domainCard"]
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