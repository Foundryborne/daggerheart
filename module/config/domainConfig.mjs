export const domains = {
    arcana: {
        id: 'arcana',
        label: 'Arcana',
        src: 'icons/magic/symbols/circled-gem-pink.webp',
        description: 'DAGGERHEART.Domains.Arcana'
    },
    blade: {
        id: 'blade',
        label: 'Blade',
        src: 'icons/weapons/swords/sword-broad-crystal-paired.webp',
        description: 'DAGGERHEART.Domains.Blade'
    },
    bone: {
        id: 'bone',
        label: 'Bone',
        src: 'icons/skills/wounds/bone-broken-marrow-red.webp',
        description: 'DAGGERHEART.Domains.Bone'
    },
    codex: {
        id: 'codex',
        label: 'Codex',
        src: 'icons/sundries/books/book-embossed-jewel-gold-purple.webp',
        description: 'DAGGERHEART.Domains.Codex'
    },
    grace: {
        id: 'grace',
        label: 'Grace',
        src: 'icons/skills/movement/feet-winged-boots-glowing-yellow.webp',
        description: 'DAGGERHEART.Domains.Grace'
    },
    midnight: {
        id: 'midnight',
        label: 'Midnight',
        src: 'icons/environment/settlement/watchtower-castle-night.webp',
        background: 'systems/daggerheart/assets/backgrounds/MidnightBackground.webp',
        description: 'DAGGERHEART.Domains.Midnight'
    },
    sage: {
        id: 'sage',
        label: 'Sage',
        src: 'icons/sundries/misc/pipe-wooden-straight-brown.webp',
        description: 'DAGGERHEART.Domains.Sage'
    },
    splendor: {
        id: 'splendor',
        label: 'Splendor',
        src: 'icons/magic/control/control-influence-crown-gold.webp',
        description: 'DAGGERHEART.Domains.Splendor'
    },
    valor: {
        id: 'valor',
        label: 'Valor',
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
