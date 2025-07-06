export const actionTypes = {
    attack: {
        id: 'attack',
        name: 'DAGGERHEART.Actions.Types.attack.name',
        icon: 'fa-swords'
    },
    healing: {
        id: 'healing',
        name: 'DAGGERHEART.Actions.Types.healing.name',
        icon: 'fa-kit-medical'
    },
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
    },
    beastform: {
        id: 'beastform',
        name: 'DAGGERHEART.Actions.Types.beastform.name',
        icon: 'fa-paw'
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
        label: 'DAGGERHEART.General.Disadvantage.full',
        value: -1
    },
    neutral: {
        label: 'DAGGERHEART.General.Neutral.full',
        value: 0
    },
    advantage: {
        label: 'DAGGERHEART.General.Advantage.full',
        value: 1
    }
};
