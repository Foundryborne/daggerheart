export const actionTypes = {
    attack: {
        id: 'attack',
        name: 'DAGGERHEART.Actions.Types.attack.name',
        icon: 'fa-swords'
    },
    // spellcast: {
    //     id: 'spellcast',
    //     name: 'DAGGERHEART.Actions.Types.spellcast.name',
    //     icon: 'fa-book-sparkles'
    // },
    healing: {
        id: 'healing',
        name: 'DAGGERHEART.Actions.Types.healing.name',
        icon: 'fa-kit-medical'
    },
    // resource: {
    //     id: 'resource',
    //     name: 'DAGGERHEART.Actions.Types.resource.name',
    //     icon: 'fa-honey-pot'
    // },
    damage: {
        id: 'damage',
        name: 'DAGGERHEART.Actions.Types.damage.name',
        icon: 'fa-bone-break'
    },
    summon: {
        id: 'summon',
        name: 'DAGGERHEART.Actions.Types.summon.name',
        icon: 'fa-ghost'
    },
    effect: {
        id: 'effect',
        name: 'DAGGERHEART.Actions.Types.effect.name',
        icon: 'fa-person-rays'
    },
    macro: {
        id: 'macro',
        name: 'DAGGERHEART.Actions.Types.macro.name',
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
};

export const diceCompare = {
    below: {
        id: 'below',
        label: 'Below',
        operator: '<'
    },
    belowEqual: {
        id: 'belowEqual',
        label: 'Below or Equal',
        operator: '<='
    },
    equal: {
        id: 'equal',
        label: 'Equal',
        operator: '='
    },
    aboveEqual: {
        id: 'aboveEqual',
        label: 'Above or Equal',
        operator: '>='
    },
    above: {
        id: 'above',
        label: 'Above',
        operator: '>'
    }
};

export const advandtageState = {
    disadvantage: {
        label: 'DAGGERHEART.General.Disadvantage.Full',
        value: -1
    },
    neutral: {
        label: 'DAGGERHEART.General.Neutral.Full',
        value: 0
    },
    advantage: {
        label: 'DAGGERHEART.General.Advantage.Full',
        value: 1
    }
}
