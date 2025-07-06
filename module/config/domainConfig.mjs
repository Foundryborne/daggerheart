export const domains = {
    arcana: {
        id: 'arcana',
        label: 'DAGGERHEART.General.Domain.arcana.label',
        src: 'systems/daggerheart/assets/icons/domains/arcana.svg',
        description: 'DAGGERHEART.General.Domain.Arcana'
    },
    blade: {
        id: 'blade',
        label: 'DAGGERHEART.General.Domain.blade.label',
        src: 'systems/daggerheart/assets/icons/domains/blade.svg',
        description: 'DAGGERHEART.General.Domain.Blade'
    },
    bone: {
        id: 'bone',
        label: 'DAGGERHEART.General.Domain.bone.label',
        src: 'systems/daggerheart/assets/icons/domains/bone.svg',
        description: 'DAGGERHEART.General.Domain.Bone'
    },
    codex: {
        id: 'codex',
        label: 'DAGGERHEART.General.Domain.codex.label',
        src: 'systems/daggerheart/assets/icons/domains/codex.svg',
        description: 'DAGGERHEART.General.Domain.Codex'
    },
    grace: {
        id: 'grace',
        label: 'DAGGERHEART.General.Domain.grace.label',
        src: 'systems/daggerheart/assets/icons/domains/grace.svg',
        description: 'DAGGERHEART.General.Domain.Grace'
    },
    midnight: {
        id: 'midnight',
        label: 'DAGGERHEART.General.Domain.midnight.label',
        src: 'systems/daggerheart/assets/icons/domains/midnight.svg',
        description: 'DAGGERHEART.General.Domain.Midnight'
    },
    sage: {
        id: 'sage',
        label: 'DAGGERHEART.General.Domain.sage.label',
        src: 'systems/daggerheart/assets/icons/domains/sage.svg',
        description: 'DAGGERHEART.General.Domain.Sage'
    },
    splendor: {
        id: 'splendor',
        label: 'DAGGERHEART.General.Domain.splendor.label',
        src: 'systems/daggerheart/assets/icons/domains/splendor.svg',
        description: 'DAGGERHEART.General.Domain.Splendor'
    },
    valor: {
        id: 'valor',
        label: 'DAGGERHEART.General.Domain.valor.label',
        src: 'systems/daggerheart/assets/icons/domains/valor.svg',
        description: 'DAGGERHEART.General.Domain.Valor'
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
        label: 'DAGGERHEART.Config.DomainCardTypes.ability',
        img: ''
    },
    spell: {
        id: 'spell',
        label: 'DAGGERHEART.Config.DomainCardTypes.spell',
        img: ''
    },
    grimoire: {
        id: 'grimoire',
        label: 'DAGGERHEART.Config.DomainCardTypes.grimoire',
        img: ''
    }
};
