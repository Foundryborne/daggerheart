export const actionTypes = {
    attack: {
        id: 'attack',
        name: 'DAGGERHEART.ACTIONS.TYPES.attack.name',
        icon: 'fa-khanda',
        tooltip: 'DAGGERHEART.ACTIONS.TYPES.attack.tooltip'
    },
    healing: {
        id: 'healing',
        name: 'DAGGERHEART.ACTIONS.TYPES.healing.name',
        icon: 'fa-kit-medical',
        tooltip: 'DAGGERHEART.ACTIONS.TYPES.healing.tooltip'
    },
    damage: {
        id: 'damage',
        name: 'DAGGERHEART.ACTIONS.TYPES.damage.name',
        icon: 'fa-heart-crack',
        tooltip: 'DAGGERHEART.ACTIONS.TYPES.damage.tooltip'
    },
    beastform: {
        id: 'beastform',
        name: 'DAGGERHEART.ACTIONS.TYPES.beastform.name',
        icon: 'fa-paw',
        tooltip: 'DAGGERHEART.ACTIONS.TYPES.beastform.tooltip'
    },
    summon: {
        id: 'summon',
        name: 'DAGGERHEART.ACTIONS.TYPES.summon.name',
        icon: 'fa-ghost',
        tooltip: 'DAGGERHEART.ACTIONS.TYPES.summon.tooltip'
    },
    effect: {
        id: 'effect',
        name: 'DAGGERHEART.ACTIONS.TYPES.effect.name',
        icon: 'fa-person-rays',
        tooltip: 'DAGGERHEART.ACTIONS.TYPES.effect.tooltip'
    },
    macro: {
        id: 'macro',
        name: 'DAGGERHEART.ACTIONS.TYPES.macro.name',
        icon: 'fa-scroll',
        tooltip: 'DAGGERHEART.ACTIONS.TYPES.macro.tooltip'
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
        label: 'DAGGERHEART.GENERAL.Disadvantage.full',
        value: -1
    },
    neutral: {
        label: 'DAGGERHEART.GENERAL.Neutral.full',
        value: 0
    },
    advantage: {
        label: 'DAGGERHEART.GENERAL.Advantage.full',
        value: 1
    }
};
