import { diceTypes, getDiceSoNicePresets, range } from '../config/generalConfig.mjs';
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
            ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.noAssignedPlayerCharacter'));
            return null;
        }
    }
    if (!target) {
        ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.noSelectedToken'));
        return null;
    }
    if (target.type !== 'character') {
        ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.onlyUseableByPC'));
        return null;
    }

    return target;
};

export const setDiceSoNiceForDualityRoll = (rollResult, advantageState) => {
    const diceSoNicePresets = getDiceSoNicePresets();
    rollResult.dice[0].options = { appearance: diceSoNicePresets.hope };
    rollResult.dice[1].options = { appearance: diceSoNicePresets.fear }; //diceSoNicePresets.fear;
    if (rollResult.dice[2] && advantageState) {
        rollResult.dice[2].options = {
            appearance: advantageState === 1 ? diceSoNicePresets.advantage : diceSoNicePresets.disadvantage
        };
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
                src: option.src,
                description: option.description
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
                return `<tag
                            contenteditable='false'
                            spellcheck='false'
                            tabIndex="${this.settings.a11y.focusableTags ? 0 : -1}"
                            class="${this.settings.classNames.tag} ${tagData.class ? tagData.class : ''}"
                            data-tooltip="${tagData.description || tagData.name}"
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

    tagifyElement.on('add', event => {
        if (event.detail.data.__isValid === 'not allowed') return;

        const input = event.detail.tagify.DOM.originalInput;
        const currentList = input.value ? JSON.parse(input.value) : [];
        onChange([...currentList, event.detail.data], { option: event.detail.data.value, removed: false }, input);
    });
    tagifyElement.on('remove', event => {
        const input = event.detail.tagify.DOM.originalInput;
        const currentList = input.value ? JSON.parse(input.value) : [];
        onChange(
            currentList.filter(x => x.value !== event.detail.data.value),
            { option: event.detail.data.value, removed: true },
            event.detail.tagify.DOM.originalInput
        );
    });
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
Roll.replaceFormulaData = function (formula, data = {}, { missing, warn = false } = {}) {
    const terms = Object.keys(CONFIG.DH.GENERAL.multiplierTypes).map(type => {
        return { term: type, default: 1 };
    });
    formula = terms.reduce((a, c) => a.replaceAll(`@${c.term}`, data[c.term] ?? c.default), formula);
    return nativeReplaceFormulaData(formula, data, { missing, warn });
};

export const getDamageKey = damage => {
    return ['none', 'minor', 'major', 'severe'][damage];
};

export const getDamageLabel = damage => {
    return game.i18n.localize(`DAGGERHEART.GENERAL.Damage.${getDamageKey(damage)}`);
};

export const damageKeyToNumber = key => {
    return {
        none: 0,
        minor: 1,
        major: 2,
        severe: 3
    }[key];
};

export default function constructHTMLButton({
    label,
    dataset = {},
    classes = [],
    icon = '',
    type = 'button',
    disabled = false
}) {
    const button = document.createElement('button');
    button.type = type;

    for (const [key, value] of Object.entries(dataset)) {
        button.dataset[key] = value;
    }
    button.classList.add(...classes);
    if (icon) icon = `<i class="${icon}"></i> `;
    if (disabled) button.disabled = true;
    button.innerHTML = `${icon}${label}`;

    return button;
}

export const adjustDice = (dice, decrease) => {
    const diceKeys = Object.keys(diceTypes);
    const index = diceKeys.indexOf(dice);
    const newIndex = decrease ? Math.max(index - 1, 0) : Math.min(index + 1, diceKeys.length - 1);
    return diceTypes[diceKeys[newIndex]];
};

export const adjustRange = (rangeVal, decrease) => {
    const rangeKeys = Object.keys(range);
    const index = rangeKeys.indexOf(rangeVal);
    const newIndex = decrease ? Math.max(index - 1, 0) : Math.min(index + 1, rangeKeys.length - 1);
    return range[rangeKeys[newIndex]];
};

export const updateActorTokens = async (actor, update) => {
    await actor.prototypeToken.update(update);

    /* Update the tokens in all scenes belonging to Actor */
    for (let token of actor.getDependentTokens()) {
        const tokenActor = token.baseActor ?? token.actor;
        if (tokenActor?.id === actor.id) {
            await token.update(update);
        }
    }
};

/**
 * Retrieves a Foundry document associated with the nearest ancestor element
 * that has a `data-item-uuid` attribute.
 * @param {HTMLElement} element - The DOM element to start the search from.
 * @returns {foundry.abstract.Document|null} The resolved document, or null if not found or invalid.
 */
export function getDocFromElement(element) {
    const target = element.closest('[data-item-uuid]');
    return foundry.utils.fromUuidSync(target.dataset.itemUuid) ?? null;
}


export const itemAbleRollParse = (value, actor, item) => {
    if (!value) return value;

    const isItemTarget = value.toLowerCase().startsWith('item.');
    const slicedValue = isItemTarget ? value.slice(5) : value;
    try {
        return Roll.replaceFormulaData(slicedValue, isItemTarget ? item : actor);
    } catch (_) {
        return '';
    }
};

export const arraysEqual = (a, b) =>
  a.length === b.length &&
  [...new Set([...a, ...b])].every(
    v => a.filter(e => e === v).length === b.filter(e => e === v).length
  );

export const setsEqual = (a, b) =>
    a.size === b.size &&
    [...a].every(
        value => b.has(value)
    );