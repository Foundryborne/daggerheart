import { getDiceSoNicePresets } from '../config/generalConfig.mjs';
import Tagify from '@yaireo/tagify';

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

export function rollCommandToJSON(text) {
    if (!text) return {};

    // Match key="quoted string"  OR  key=unquotedValue
    const PAIR_RE = /(\w+)=("(?:[^"\\]|\\.)*"|\S+)/g;
    const result = {};
    for (const [, key, raw] of text.matchAll(PAIR_RE)) {
        let value;
        if (raw.startsWith('"') && raw.endsWith('"')) {
            // Strip the surrounding quotes, un-escape any \" sequences
            value = raw.slice(1, -1).replace(/\\"/g, '"');
        } else if (/^(true|false)$/i.test(raw)) {
            // Boolean
            value = raw.toLowerCase() === 'true';
        } else if (!Number.isNaN(Number(raw))) {
            // Numeric
            value = Number(raw);
        } else {
            // Fallback to string
            value = raw;
        }
        result[key] = value;
    }
    return Object.keys(result).length > 0 ? result : null;
}

export const getCommandTarget = () => {
    let target = game.canvas.tokens.controlled.length > 0 ? game.canvas.tokens.controlled[0].actor : null;
    if (!game.user.isGM) {
        target = game.user.character;
        if (!target) {
            ui.notifications.error(game.i18n.localize('DAGGERHEART.Notification.Error.NoAssignedPlayerCharacter'));
            return null;
        }
    }
    if (!target) {
        ui.notifications.error(game.i18n.localize('DAGGERHEART.Notification.Error.NoSelectedToken'));
        return null;
    }
    if (target.type !== 'character') {
        ui.notifications.error(game.i18n.localize('DAGGERHEART.Notification.Error.OnlyUseableByPC'));
        return null;
    }

    return target;
};

export const setDiceSoNiceForDualityRoll = (rollResult, advantageState) => {
    const diceSoNicePresets = getDiceSoNicePresets();
    rollResult.dice[0].options.appearance = diceSoNicePresets.hope;
    rollResult.dice[1].options.appearance = diceSoNicePresets.fear;
    if (rollResult.dice[2]) {
        if (advantageState === true) {
            rollResult.dice[2].options.appearance = diceSoNicePresets.advantage;
        } else if (advantageState === false) {
            rollResult.dice[2].options.appearance = diceSoNicePresets.disadvantage;
        }
    }
};

export const chunkify = (array, chunkSize, mappingFunc) => {
    var chunkifiedArray = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        const chunk = array.slice(i, i + chunkSize);
        if (mappingFunc) {
            chunkifiedArray.push(mappingFunc(chunk));
        } else {
            chunkifiedArray.push(chunk);
        }
    }

    return chunkifiedArray;
};

export const tagifyElement = (element, options, onChange, tagifyOptions = {}) => {
    const { maxTags } = tagifyOptions;
    const tagifyElement = new Tagify(element, {
        tagTextProp: 'name',
        enforceWhitelist: true,
        whitelist: Object.keys(options).map(key => {
            const option = options[key];
            return {
                value: key,
                name: game.i18n.localize(option.label),
                src: option.src
            };
        }),
        maxTags: maxTags,
        dropdown: {
            mapValueTo: 'name',
            searchKeys: ['name'],
            enabled: 0,
            maxItems: 20,
            closeOnSelect: true,
            highlightFirst: false
        },
        templates: {
            tag(tagData) {
                return `<tag title="${tagData.title || tagData.value}"
                            contenteditable='false'
                            spellcheck='false'
                            tabIndex="${this.settings.a11y.focusableTags ? 0 : -1}"
                            class="${this.settings.classNames.tag} ${tagData.class ? tagData.class : ''}"
                            ${this.getAttributes(tagData)}> 
                    <x class="${this.settings.classNames.tagX}" role='button' aria-label='remove tag'></x>
                    <div>
                        <span class="${this.settings.classNames.tagText}">${tagData[this.settings.tagTextProp] || tagData.value}</span>
                        ${tagData.src ? `<img src="${tagData.src}"></i>` : ''}
                    </div>
                </tag>`;
            }
        }
    });

    const onSelect = async event => {
        const inputElement = event.detail.tagify.DOM.originalInput;
        const selectedOptions = event.detail?.value ? JSON.parse(event.detail.value) : [];

        const unusedDropDownItems = event.detail.tagify.suggestedListItems;
        const missingOptions = Object.keys(options).filter(x => !unusedDropDownItems.find(item => item.value === x));
        const removedItem = missingOptions.find(x => !selectedOptions.find(item => item.value === x));
        const addedItem = removedItem
            ? null
            : selectedOptions.find(x => !missingOptions.find(item => item === x.value));

        const changedItem = { option: removedItem ?? addedItem.value, removed: Boolean(removedItem) };

        onChange(selectedOptions, changedItem, inputElement);
    };
    tagifyElement.on('change', onSelect);
};

export const getDeleteKeys = (property, innerProperty, innerPropertyDefaultValue) => {
    return Object.keys(property).reduce((acc, key) => {
        if (innerProperty) {
            if (innerPropertyDefaultValue !== undefined) {
                acc[`${key}`] = {
                    [innerProperty]: innerPropertyDefaultValue
                };
            } else {
                acc[`${key}.-=${innerProperty}`] = null;
            }
        } else {
            acc[`-=${key}`] = null;
        }

        return acc;
    }, {});
};

// Fix on Foundry native formula replacement for DH
const nativeReplaceFormulaData = Roll.replaceFormulaData;
Roll.replaceFormulaData = function (formula, data, { missing, warn = false } = {}) {
    const terms = [
        { term: 'prof', default: 1 },
        { term: 'cast', default: 1 }
    ];
    formula = terms.reduce((a, c) => a.replaceAll(`@${c.term}`, data[c.term] ?? c.default), formula);
    return nativeReplaceFormulaData(formula, data, { missing, warn });
};

export const getDamageLabel = damage => {
    switch (damage) {
        case 3:
            return game.i18n.localize('DAGGERHEART.General.Damage.Severe');
        case 2:
            return game.i18n.localize('DAGGERHEART.General.Damage.Major');
        case 1:
            return game.i18n.localize('DAGGERHEART.General.Damage.Minor');
        case 0:
            return game.i18n.localize('DAGGERHEART.General.Damage.None');
    }
};

export const damageKeyToNumber = key => {
    switch (key) {
        case 'severe':
            return 3;
        case 'major':
            return 2;
        case 'minor':
            return 1;
        case 'none':
            return 0;
    }
};
