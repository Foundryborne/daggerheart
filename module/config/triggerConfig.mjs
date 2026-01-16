/* hints and returns are intentionally not translated. They are programatical terms and best understood in english */
export const triggers = {
    dualityRoll: {
        id: 'dualityRoll',
        usesActor: true,
        args: ['roll', 'actor'],
        label: 'DAGGERHEART.CONFIG.Triggers.dualityRoll.label',
        hint: 'this: Action, roll: DhRoll, actor: DhActor',
        returns: '{ updates: [{ key, value, total }] }'
    },
    fearRoll: {
        id: 'fearRoll',
        usesActor: true,
        args: ['roll', 'actor'],
        label: 'DAGGERHEART.CONFIG.Triggers.fearRoll.label',
        hint: 'this: Action, roll: DhRoll, actor: DhActor',
        returns: '{ updates: [{ key, value, total }] }'
    },
    postDamageReduction: {
        id: 'postDamageReduction',
        usesActor: true,
        args: ['damageUpdates', 'actor'],
        label: 'DAGGERHEART.CONFIG.Triggers.postDamageReduction.label',
        hint: 'damageUpdates: ResourceUpdates, actor: DhActor',
        returns: '{ updates: [{ originActor: this.actor, updates: [{ key, value, total }] }] }'
    }
};

export const triggerActorTargetType = {
    any: {
        id: 'any',
        label: 'DAGGERHEART.CONFIG.TargetTypes.any'
    },
    self: {
        id: 'self',
        label: 'DAGGERHEART.CONFIG.TargetTypes.self'
    },
    other: {
        id: 'other',
        label: 'DAGGERHEART.CONFIG.TargetTypes.other'
    }
};
