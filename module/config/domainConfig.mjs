export const domains = {
    arcana: {
        id: 'arcana',
        label: 'DAGGERHEART.Domains.Arcana.label',
        src: 'icons/magic/symbols/circled-gem-pink.webp',
        description: 'DAGGERHEART.Domains.Arcana'
    },
    blade: {
        id: 'blade',
        label: 'DAGGERHEART.Domains.Blade.label',
        src: 'icons/weapons/swords/sword-broad-crystal-paired.webp',
        description: 'DAGGERHEART.Domains.Blade'
    },
    bone: {
        id: 'bone',
        label: 'DAGGERHEART.Domains.Bone.label',
        src: 'icons/skills/wounds/bone-broken-marrow-red.webp',
        description: 'DAGGERHEART.Domains.Bone'
    },
    codex: {
        id: 'codex',
        label: 'DAGGERHEART.Domains.Codex.label',
        src: 'icons/sundries/books/book-embossed-jewel-gold-purple.webp',
        description: 'DAGGERHEART.Domains.Codex'
    },
    grace: {
        id: 'grace',
        label: 'DAGGERHEART.Domains.Grace.label',
        src: 'icons/skills/movement/feet-winged-boots-glowing-yellow.webp',
        description: 'DAGGERHEART.Domains.Grace'
    },
    midnight: {
        id: 'midnight',
        label: 'DAGGERHEART.Domains.Midnight.label',
        src: 'icons/environment/settlement/watchtower-castle-night.webp',
        background: 'systems/daggerheart/assets/backgrounds/MidnightBackground.webp',
        description: 'DAGGERHEART.Domains.Midnight'
    },
    sage: {
        id: 'sage',
        label: 'DAGGERHEART.Domains.Sage.label',
        src: 'icons/sundries/misc/pipe-wooden-straight-brown.webp',
        description: 'DAGGERHEART.Domains.Sage'
    },
    splendor: {
        id: 'splendor',
        label: 'DAGGERHEART.Domains.Splendor.label',
        src: 'icons/magic/control/control-influence-crown-gold.webp',
        description: 'DAGGERHEART.Domains.Splendor'
    },
    valor: {
        id: 'valor',
        label: 'DAGGERHEART.Domains.Valor.label',
        src: 'icons/magic/control/control-influence-rally-purple.webp',
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
