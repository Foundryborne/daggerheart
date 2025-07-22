export const domains = {
    arcana: {
        id: 'arcana',
        label: 'DAGGERHEART.GENERAL.Domain.arcana.label',
        src: 'systems/daggerheart/assets/icons/domains/arcana.svg',
        description: 'DAGGERHEART.GENERAL.Domain.arcana.description'
    },
    blade: {
        id: 'blade',
        label: 'DAGGERHEART.GENERAL.Domain.blade.label',
        src: 'systems/daggerheart/assets/icons/domains/blade.svg',
        description: 'DAGGERHEART.GENERAL.Domain.blade.description'
    },
    bone: {
        id: 'bone',
        label: 'DAGGERHEART.GENERAL.Domain.bone.label',
        src: 'systems/daggerheart/assets/icons/domains/bone.svg',
        description: 'DAGGERHEART.GENERAL.Domain.bone.description'
    },
    codex: {
        id: 'codex',
        label: 'DAGGERHEART.GENERAL.Domain.codex.label',
        src: 'systems/daggerheart/assets/icons/domains/codex.svg',
        description: 'DAGGERHEART.GENERAL.Domain.codex.description'
    },
    grace: {
        id: 'grace',
        label: 'DAGGERHEART.GENERAL.Domain.grace.label',
        src: 'systems/daggerheart/assets/icons/domains/grace.svg',
        description: 'DAGGERHEART.GENERAL.Domain.grace.description'
    },
    midnight: {
        id: 'midnight',
        label: 'DAGGERHEART.GENERAL.Domain.midnight.label',
        src: 'systems/daggerheart/assets/icons/domains/midnight.svg',
        description: 'DAGGERHEART.GENERAL.Domain.midnight.description'
    },
    sage: {
        id: 'sage',
        label: 'DAGGERHEART.GENERAL.Domain.sage.label',
        src: 'systems/daggerheart/assets/icons/domains/sage.svg',
        description: 'DAGGERHEART.GENERAL.Domain.sage.description'
    },
    splendor: {
        id: 'splendor',
        label: 'DAGGERHEART.GENERAL.Domain.splendor.label',
        src: 'systems/daggerheart/assets/icons/domains/splendor.svg',
        description: 'DAGGERHEART.GENERAL.Domain.splendor.description'
    },
    valor: {
        id: 'valor',
        label: 'DAGGERHEART.GENERAL.Domain.valor.label',
        src: 'systems/daggerheart/assets/icons/domains/valor.svg',
        description: 'DAGGERHEART.GENERAL.Domain.valor.description'
    }
};

export const classDomainMap = {
    rogue: [domains.midnight, domains.grace]
};

export const subclassMap = {
    syndicate: {
        id: 'syndicate',
        label: 'Syndicate'
    },
    nightwalker: {
        id: 'nightwalker',
        label: 'Nightwalker'
    }
};

export const classMap = {
    rogue: {
        label: 'Rogue',
        subclasses: [subclassMap.syndicate.id, subclassMap.nightwalker.id]
    },
    seraph: {
        label: 'Seraph',
        subclasses: []
    }
};

export const cardTypes = {
    ability: {
        id: 'ability',
        label: 'DAGGERHEART.CONFIG.DomainCardTypes.ability',
        img: ''
    },
    spell: {
        id: 'spell',
        label: 'DAGGERHEART.CONFIG.DomainCardTypes.spell',
        img: ''
    },
    grimoire: {
        id: 'grimoire',
        label: 'DAGGERHEART.CONFIG.DomainCardTypes.grimoire',
        img: ''
    }
};
