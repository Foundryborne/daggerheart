export const BaseBPPerEncounter = nrCharacters => 3 * nrCharacters + 2;

export const adversaryTypeCostBrackets = {
    1: [
        {
            sort: 1,
            types: ['minion'],
            description: 'DAGGERHEART.CONFIG.AdversaryTypeCost.minion'
        },
        {
            sort: 2,
            types: ['social', 'support'],
            description: 'DAGGERHEART.CONFIG.AdversaryTypeCost.support'
        }
    ],
    2: [
        {
            sort: 1,
            types: ['horde', 'ranged', 'skulk', 'standard'],
            description: 'DAGGERHEART.CONFIG.AdversaryTypeCost.standard'
        }
    ],
    3: [
        {
            sort: 1,
            types: ['leader'],
            description: 'DAGGERHEART.CONFIG.AdversaryTypeCost.leader'
        }
    ],
    4: [
        {
            sort: 1,
            types: ['bruiser'],
            description: 'DAGGERHEART.CONFIG.AdversaryTypeCost.bruiser'
        }
    ],
    5: [
        {
            sort: 1,
            types: ['solo'],
            description: 'DAGGERHEART.CONFIG.AdversaryTypeCost.solo'
        }
    ]
};

export const BPModifiers = {
    [-2]: {
        manySolos: {
            sort: 1,
            description: 'DAGGERHEART.CONFIG.BPModifiers.manySolos'
        },
        increaseDamage: {
            sort: 2,
            description: 'DAGGERHEART.CONFIG.BPModifiers.increaseDamage'
        }
    },
    [-1]: {
        lessDifficult: {
            sort: 2,
            description: 'DAGGERHEART.CONFIG.BPModifiers.lessDifficult'
        }
    },
    1: {
        lowerTier: {
            sort: 1,
            description: 'DAGGERHEART.CONFIG.BPModifiers.lowerTier'
        },
        noToughies: {
            sort: 2,
            description: 'DAGGERHEART.CONFIG.BPModifiers.noToughies'
        }
    },
    2: {
        moreDangerous: {
            sort: 2,
            description: 'DAGGERHEART.CONFIG.BPModifiers.moreDangerous'
        }
    }
};
