// Armor and weapon features are initialized in daggerheart.mjs 

/** @type {ReturnType<import("./itemFeatures.mjs").createArmorFeatures} */
export const armorFeatures = {};

/** @type {ReturnType<import("./itemFeatures.mjs").createWeaponFeatures} */
export const weaponFeatures = {};

export const allArmorFeatures = () => {
    const homebrewFeatures = game.system.settings.homebrew.itemFeatures.armorFeatures;
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

export const allWeaponFeatures = () => {
    const homebrewFeatures = game.system.settings.homebrew.itemFeatures.weaponFeatures;
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

/** 
 * Sub categories read by the loot sheet during data preparation. 
 * Intended to be injected into by modules, primarily the premium module
 * @type {Record<string, { label: string; sheetGroup?: string; data?: foundry.data.fields.DataField; hasDescription?: (item: DhItem, data: object) => boolean; updateDescriptionData?: (item: DhItem, data: object, options, config) }>}
 */
export const itemCategories = {};