export const actionTypes = {
    attack: {
        id: 'attack',
        name: 'DAGGERHEART.ACTIONS.TYPES.attack.name',
        icon: 'fa-hand-fist',
        tooltip: 'DAGGERHEART.ACTIONS.TYPES.attack.tooltip'
    },
    beastform: {
        id: 'beastform',
        name: 'DAGGERHEART.ACTIONS.TYPES.beastform.name',
        icon: 'fa-paw',
        tooltip: 'DAGGERHEART.ACTIONS.TYPES.beastform.tooltip'
    },
    countdown: {
        id: 'countdown',
        name: 'DAGGERHEART.ACTIONS.TYPES.countdown.name',
        icon: 'fa-hourglass-half',
        tooltip: 'DAGGERHEART.ACTIONS.TYPES.countdown.tooltip'
    },
    damage: {
        id: 'damage',
        name: 'DAGGERHEART.ACTIONS.TYPES.damage.name',
        icon: 'fa-heart-crack',
        tooltip: 'DAGGERHEART.ACTIONS.TYPES.damage.tooltip'
    },
    evolution: {
        id: 'evolution',
        name: 'DAGGERHEART.ACTIONS.TYPES.evolution.name',
        icon: 'fa-vial',
        tooltip: 'DAGGERHEART.ACTIONS.TYPES.evolution.tooltip'
    },
    effect: {
        id: 'effect',
        name: 'DAGGERHEART.ACTIONS.TYPES.effect.name',
        icon: 'fa-person-rays',
        tooltip: 'DAGGERHEART.ACTIONS.TYPES.effect.tooltip'
    },
    healing: {
        id: 'healing',
        name: 'DAGGERHEART.ACTIONS.TYPES.healing.name',
        icon: 'fa-kit-medical',
        tooltip: 'DAGGERHEART.ACTIONS.TYPES.healing.tooltip'
    },
    macro: {
        id: 'macro',
        name: 'DAGGERHEART.ACTIONS.TYPES.macro.name',
        icon: 'fa-scroll',
        tooltip: 'DAGGERHEART.ACTIONS.TYPES.macro.tooltip'
    },
    summon: {
        id: 'summon',
        name: 'DAGGERHEART.ACTIONS.TYPES.summon.name',
        icon: 'fa-ghost',
        tooltip: 'DAGGERHEART.ACTIONS.TYPES.summon.tooltip'
    },
    transform: {
        id: 'transform',
        name: 'DAGGERHEART.ACTIONS.TYPES.transform.name',
        icon: 'fa-dragon',
        tooltip: 'DAGGERHEART.ACTIONS.TYPES.transform.tooltip'
    }
};

export const damageOnSave = {
    none: {
        id: 'none',
        label: 'DAGGERHEART.CONFIG.DamageOnSave.none.name',
        mod: 0,
        onSuccess: true
    },
    half: {
        id: 'half',
        label: 'DAGGERHEART.CONFIG.DamageOnSave.half.name',
        mod: 0.5,
        onSuccess: true
    },
    full: {
        id: 'full',
        label: 'DAGGERHEART.CONFIG.DamageOnSave.full.name',
        mod: 1,
        onSuccess: true
    },
    doubleOnFail: {
        id: 'doubleOnFail',
        label: 'DAGGERHEART.CONFIG.DamageOnSave.doubleOnFail.name',
        mod: 2,
        onSuccess: false
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

export const advantageState = {
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

export const areaTypes = {
    placed: {
        id: 'placed',
        label: 'DAGGERHEART.CONFIG.AreaTypes.placed.label'
    },
    attached: {
        id: 'attached',
        label: 'DAGGERHEART.CONFIG.AreaTypes.attached.label'
    }
};

export const evolutionStates = {
    unevolved: {
        id: 'unevolved', 
        label: 'DAGGERHEART.CONFIG.EvolutionState.unevolved'
    },
    evolved: {
        id: 'evolved',
        label: 'DAGGERHEART.CONFIG.EvolutionState.evolved'
    }
}

export const dynamicEffects = {
    RING_PULSE: {
        id: 'RING_PULSE',
        label: 'TOKEN.RING.EFFECTS.RING_PULSE',
        value: 0x2
    },
    RING_GRADIENT: {
        id: 'RING_GRADIENT',
        label: 'TOKEN.RING.EFFECTS.RING_GRADIENT',
        value: 0x4
    },
    BKG_WAVE: {
        id: 'BKG_WAVE',
        label: 'TOKEN.RING.EFFECTS.BKG_WAVE',
        value: 0x8
    },
    INVISIBILITY: {
        id: 'INVISIBILITY',
        label: 'TOKEN.RING.EFFECTS.INVISIBILITY',
        value: 0x10
    },
    COLOR_OVER_SUBJECT: {
        id: 'COLOR_OVER_SUBJECT',
        label: 'TOKEN.RING.EFFECTS.COLOR_OVER_SUBJECT',
        value: 0x20
    }
}