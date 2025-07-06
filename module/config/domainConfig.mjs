export const domains = {
    arcana: {
        id: 'arcana',
        label: 'DAGGERHEART.GENERAL.Domain.arcana.label',
        src: 'systems/daggerheart/assets/icons/domains/arcana.svg',
        description: 'DAGGERHEART.GENERAL.Domain.Arcana'
    },
    blade: {
        id: 'blade',
        label: 'DAGGERHEART.GENERAL.Domain.blade.label',
        src: 'systems/daggerheart/assets/icons/domains/blade.svg',
        description: 'DAGGERHEART.GENERAL.Domain.Blade'
    },
    bone: {
        id: 'bone',
        label: 'DAGGERHEART.GENERAL.Domain.bone.label',
        src: 'systems/daggerheart/assets/icons/domains/bone.svg',
        description: 'DAGGERHEART.GENERAL.Domain.Bone'
    },
    codex: {
        id: 'codex',
        label: 'DAGGERHEART.GENERAL.Domain.codex.label',
        src: 'systems/daggerheart/assets/icons/domains/codex.svg',
        description: 'DAGGERHEART.GENERAL.Domain.Codex'
    },
    grace: {
        id: 'grace',
        label: 'DAGGERHEART.GENERAL.Domain.grace.label',
        src: 'systems/daggerheart/assets/icons/domains/grace.svg',
        description: 'DAGGERHEART.GENERAL.Domain.Grace'
    },
    midnight: {
        id: 'midnight',
        label: 'DAGGERHEART.GENERAL.Domain.midnight.label',
        src: 'systems/daggerheart/assets/icons/domains/midnight.svg',
        description: 'DAGGERHEART.GENERAL.Domain.Midnight'
    },
    sage: {
        id: 'sage',
        label: 'DAGGERHEART.GENERAL.Domain.sage.label',
        src: 'systems/daggerheart/assets/icons/domains/sage.svg',
        description: 'DAGGERHEART.GENERAL.Domain.Sage'
    },
    splendor: {
        id: 'splendor',
        label: 'DAGGERHEART.GENERAL.Domain.splendor.label',
        src: 'systems/daggerheart/assets/icons/domains/splendor.svg',
        description: 'DAGGERHEART.GENERAL.Domain.Splendor'
    },
    valor: {
        id: 'valor',
        label: 'DAGGERHEART.GENERAL.Domain.valor.label',
        src: 'systems/daggerheart/assets/icons/domains/valor.svg',
        description: 'DAGGERHEART.GENERAL.Domain.Valor'
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
