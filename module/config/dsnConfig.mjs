const dhHopeColorset = {
    name: 'daggerheart-hope-colorset',
    category: 'Daggerheart',
    description: 'DAGGERHEART.CONFIG.DiceSoNice.colorsets.hope',
    foreground: '#ffffff',
    background: '#ffe760',
    outline: '#000000',
    edge: '#ffffff',
    texture: 'astralsea',
    material: 'metal'
};

const dhFearColorset = {
    name: 'daggerheart-fear-colorset',
    category: 'Daggerheart',
    description: 'DAGGERHEART.CONFIG.DiceSoNice.colorsets.fear',
    foreground: '#000000',
    background: '#0032b1',
    outline: '#ffffff',
    edge: '#000000',
    texture: 'astralsea',
    material: 'metal'
};

const dhAdvantageColorset = {
    name: 'daggerheart-advantage-colorset',
    category: 'Daggerheart',
    description: 'DAGGERHEART.CONFIG.DiceSoNice.colorsets.advantage',
    foreground: '#ffffff',
    background: '#008000',
    outline: '#000000',
    edge: '#ffffff',
    texture: 'astralsea',
    material: 'metal'
};

const dhDisadvantageColorset = {
    name: 'daggerheart-disadvantage-colorset',
    category: 'Daggerheart',
    description: 'DAGGERHEART.CONFIG.DiceSoNice.colorsets.disadvantage',
    foreground: '#000000',
    background: '#b30000',
    outline: '#ffffff',
    edge: '#000000',
    texture: 'astralsea',
    material: 'metal'
};

export const dhColorsets = [dhHopeColorset, dhFearColorset, dhAdvantageColorset, dhDisadvantageColorset];

export const colorsetDefaults = {
    hope: dhHopeColorset.name,
    fear: dhFearColorset.name,
    advantage: dhAdvantageColorset.name,
    disadvantage: dhDisadvantageColorset.name
};

export const systemDefaults = {
    hope: 'standard',
    fear: 'standard',
    advantage: 'standard',
    disadvantage: 'standard'
}

export const getDiceRoles = () => ([
    {
        id: 'hope',
        label: 'DAGGERHEART.CONFIG.DiceSoNice.diceRoles.hope',
        group: 'Daggerheart',
        customizable: true,
        dieTypes: ['d2', 'd4', 'd6', 'd8', 'd10', 'd12', 'd20'],
        detectors: { modifiers: ['h'] },
        defaults: { global: { colorset: colorsetDefaults.hope, system: systemDefaults.hope }}
    },
    {
        id: 'fear',
        label: 'DAGGERHEART.CONFIG.DiceSoNice.diceRoles.fear',
        group: 'Daggerheart',
        customizable: true,
        dieTypes: ['d2', 'd4', 'd6', 'd8', 'd10', 'd12', 'd20'],
        detectors: { modifiers: ['f'] },
        defaults: { global: { colorset: colorsetDefaults.fear, system: systemDefaults.fear }}
    },
    {
        id: 'advantage',
        label: 'DAGGERHEART.CONFIG.DiceSoNice.diceRoles.advantage',
        group: 'Daggerheart',
        customizable: true,
        dieTypes: ['d2', 'd4', 'd6', 'd8', 'd10', 'd12', 'd20'],
        detectors: { modifiers: ['a'] },
        defaults: { global: { colorset: colorsetDefaults.advantage, system: systemDefaults.advantage }}
    },
    {
        id: 'disadvantage',
        label: 'DAGGERHEART.CONFIG.DiceSoNice.diceRoles.disadvantage',
        group: 'Daggerheart',
        customizable: true,
        dieTypes: ['d2', 'd4', 'd6', 'd8', 'd10', 'd12', 'd20'],
        detectors: { modifiers: ['d'] },
        defaults: { global: { colorset: colorsetDefaults.disadvantage, system: systemDefaults.disadvantage }}
    }
]);

export const dualityTrigger = {
    name: 'daggerheart-duality-trigger', 
    label: 'DAGGERHEART.CONFIG.DiceSoNice.triggers.dualityRoll.label',
    ids: [
        { id: 'hope', name: 'DAGGERHEART.CONFIG.DiceSoNice.triggers.dualityRoll.results.hope' },
        { id: 'fear', name: 'DAGGERHEART.CONFIG.DiceSoNice.triggers.dualityRoll.results.fear' },
        { id: 'critical', name: 'DAGGERHEART.CONFIG.DiceSoNice.triggers.dualityRoll.results.critical' }
    ],
    sfxTriggers: { 
        critical: { id: 'daggerheart-duality-trigger', result: 'critical' },
        hope: { id: 'daggerheart-duality-trigger', result: 'hope' },
        fear: { id: 'daggerheart-duality-trigger', result: 'fear' }     
    }
};

export const gmRollTrigger = {
    name: 'daggerheart-gm-roll-trigger', 
    label: 'DAGGERHEART.CONFIG.DiceSoNice.triggers.gmRoll.label',
    ids: [
        { id: 'critical', name: 'DAGGERHEART.CONFIG.DiceSoNice.triggers.gmRoll.results.critical' }
    ],
    sfxTriggers: { 
        critical: { id: 'daggerheart-gm-roll-trigger', result: 'critical' }    
    }
};


export const dhTriggers = [dualityTrigger, gmRollTrigger];