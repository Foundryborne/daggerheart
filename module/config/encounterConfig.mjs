export const BaseBPPerEncounter = nrCharacters => 3 * nrCharacters + 2;

export const AdversaryBPPerEncounter = (adversaries, characters) => {
    const adversaryTypes = CONFIG.DH.ACTOR.allAdversaryTypes();
    return adversaries
        .reduce((acc, adversary) => {
            const existingEntry = acc.find(
                x => x.adversary.name === adversary.name && x.adversary.type === adversary.type
            );
            if (existingEntry) {
                existingEntry.nr += 1;
            } else {
                acc.push({ adversary, nr: 1 });
            }
            return acc;
        }, [])
        .reduce((acc, entry) => {
            const adversary = entry.adversary;
            const type = adversaryTypes[adversary.type];
            const bpCost = type.bpCost ?? 0;
            if (type.partyAmountPerBP) {
                acc += characters.length === 0 ? 0 : Math.ceil(entry.nr / characters.length);
            } else {
                acc += bpCost;
            }

            return acc;
        }, 0);
};

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
