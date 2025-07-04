export const domains = {
    arcana: {
        id: 'arcana',
        label: 'DAGGERHEART.Domains.arcana.label',
        src: 'systems/daggerheart/assets/icons/domains/arcana.svg',
        description: 'DAGGERHEART.Domains.Arcana'
    },
    blade: {
        id: 'blade',
        label: 'DAGGERHEART.Domains.blade.label',
        src: 'systems/daggerheart/assets/icons/domains/blade.svg',
        description: 'DAGGERHEART.Domains.Blade'
    },
    bone: {
        id: 'bone',
        label: 'DAGGERHEART.Domains.bone.label',
        src: 'systems/daggerheart/assets/icons/domains/bone.svg',
        description: 'DAGGERHEART.Domains.Bone'
    },
    codex: {
        id: 'codex',
        label: 'DAGGERHEART.Domains.codex.label',
        src: 'systems/daggerheart/assets/icons/domains/codex.svg',
        description: 'DAGGERHEART.Domains.Codex'
    },
    grace: {
        id: 'grace',
        label: 'DAGGERHEART.Domains.grace.label',
        src: 'systems/daggerheart/assets/icons/domains/grace.svg',
        description: 'DAGGERHEART.Domains.Grace'
    },
    midnight: {
        id: 'midnight',
        label: 'DAGGERHEART.Domains.midnight.label',
        src: 'systems/daggerheart/assets/icons/domains/midnight.svg',
        description: 'DAGGERHEART.Domains.Midnight'
    },
    sage: {
        id: 'sage',
        label: 'DAGGERHEART.Domains.sage.label',
        src: 'systems/daggerheart/assets/icons/domains/sage.svg',
        description: 'DAGGERHEART.Domains.Sage'
    },
    splendor: {
        id: 'splendor',
        label: 'DAGGERHEART.Domains.splendor.label',
        src: 'systems/daggerheart/assets/icons/domains/splendor.svg',
        description: 'DAGGERHEART.Domains.Splendor'
    },
    valor: {
        id: 'valor',
        label: 'DAGGERHEART.Domains.valor.label',
        src: 'systems/daggerheart/assets/icons/domains/valor.svg',
        description: 'DAGGERHEART.Domains.Valor'
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
        label: 'DAGGERHEART.Domain.CardTypes.ability',
        img: ''
    },
    spell: {
        id: 'spell',
        label: 'DAGGERHEART.Domain.CardTypes.spell',
        img: ''
    },
    grimoire: {
        id: 'grimoire',
        label: 'DAGGERHEART.Domain.CardTypes.grimoire',
        img: ''
    }
};
