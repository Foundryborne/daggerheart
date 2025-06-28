export const actionTypes = {
    attack: {
        id: 'attack',
        name: 'DAGGERHEART.Actions.Types.Attack.Name',
        icon: 'fa-swords'
    },
    // spellcast: {
    //     id: 'spellcast',
    //     name: 'DAGGERHEART.Actions.Types.Spellcast.Name',
    //     icon: 'fa-book-sparkles'
    // },
    healing: {
        id: 'healing',
        name: 'DAGGERHEART.Actions.Types.Healing.Name',
        icon: 'fa-kit-medical'
    },
    // resource: {
    //     id: 'resource',
    //     name: 'DAGGERHEART.Actions.Types.Resource.Name',
    //     icon: 'fa-honey-pot'
    // },
    damage: {
        id: 'damage',
        name: 'DAGGERHEART.Actions.Types.Damage.Name',
        icon: 'fa-bone-break'
    },
    summon: {
        id: 'summon',
        name: 'DAGGERHEART.Actions.Types.Summon.Name',
        icon: 'fa-ghost'
    },
    effect: {
        id: 'effect',
        name: 'DAGGERHEART.Actions.Types.Effect.Name',
        icon: 'fa-person-rays'
    },
    macro: {
        id: 'macro',
        name: 'DAGGERHEART.Actions.Types.Macro.Name',
        icon: 'fa-scroll'
    }
};

export const targetTypes = {
    self: {
        id: 'self',
        label: 'Self'
    },
    friendly: {
        id: 'friendly',
        label: 'Friendly'
    },
    hostile: {
        id: 'hostile',
        label: 'Hostile'
    },
    any: {
        id: 'any',
        label: 'Any'
    }
};

export const damageOnSave = {
    none: {
        id: 'none',
        label: 'None',
        mod: 0
    },
    half: {
        id: 'half',
        label: 'Half Damage',
        mod: 0.5
    },
    full: {
        id: 'full',
        label: 'Full damage',
        mod: 1
    }
}
