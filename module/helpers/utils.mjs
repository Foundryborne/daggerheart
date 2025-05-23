export const loadCompendiumOptions = async compendiums => {
    const compendiumValues = [];

    for (var compendium of compendiums) {
        const values = await getCompendiumOptions(compendium);
        compendiumValues.push(values);
    }

    return compendiumValues;
};

const getCompendiumOptions = async compendium => {
    const compendiumPack = await game.packs.get(compendium);

    const values = [];
    for (var value of compendiumPack.index) {
        const document = await compendiumPack.getDocument(value._id);
        values.push(document);
    }

    return values;
};

export const getWidthOfText = (txt, fontsize, allCaps, bold) => {
    // if(getWidthOfText.e === undefined){
    //     getWidthOfText.e = document.createElement('span');
    //     getWidthOfText.e.style.display = "none";
    //     document.body.appendChild(getWidthOfText.e);
    // }
    // if(getWidthOfText.e.style.fontSize !== fontsize)
    //     getWidthOfText.e.style.fontSize = fontsize;
    // if(getWidthOfText.e.style.fontFamily !== 'Signika, sans-serif')
    //     getWidthOfText.e.style.fontFamily = 'Signika, sans-serif';
    // getWidthOfText.e.innerText = txt;
    // return getWidthOfText.e.offsetWidth;
    const text = allCaps ? txt.toUpperCase() : txt;
    if (getWidthOfText.c === undefined) {
        getWidthOfText.c = document.createElement('canvas');
        getWidthOfText.ctx = getWidthOfText.c.getContext('2d');
    }
    var fontspec = `${bold ? 'bold' : ''} ${fontsize}px` + ' ' + 'Signika, sans-serif';
    if (getWidthOfText.ctx.font !== fontspec) getWidthOfText.ctx.font = fontspec;

    return getWidthOfText.ctx.measureText(text).width;
};

export const padArray = (arr, len, fill) => {
    return arr.concat(Array(len).fill(fill)).slice(0, len);
};

export const getTier = (level, asNr) => {
    switch (Math.floor((level + 1) / 3)) {
        case 1:
            return asNr ? 1 : 'tier1';
        case 2:
            return asNr ? 2 : 'tier2';
        case 3:
            return asNr ? 3 : 'tier3';
        default:
            return asNr ? 0 : 'tier0';
    }
};

export const capitalize = string => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

export const getPathValue = (path, entity, numeric) => {
    const pathValue = foundry.utils.getProperty(entity, path);
    if (pathValue) return numeric ? Number.parseInt(pathValue) : pathValue;

    return numeric ? Number.parseInt(path) : path;
};

export const generateId = (title, length) => {
    const id = title
        .split(' ')
        .map((w, i) => {
            const p = w.slugify({ replacement: '', strict: true });
            return i ? p.titleCase() : p;
        })
        .join('');
    return Number.isNumeric(length) ? id.slice(0, length).padEnd(length, '0') : id;
};
