import { diceTypes, getDiceSoNicePresets, range } from '../config/generalConfig.mjs';
import Tagify from '@yaireo/tagify';

export const capitalize = string => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

export function rollCommandToJSON(text, raw) {
    if (!text) return {};

    const flavorMatch = raw?.match(/{(.*)}$/);
    const flavor = flavorMatch ? flavorMatch[1] : null;

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
    return Object.keys(result).length > 0 ? { result, flavor } : null;
}

export const getCommandTarget = (options = {}) => {
    const { allowNull = false } = options;
    let target = game.canvas.tokens.controlled.length > 0 ? game.canvas.tokens.controlled[0].actor : null;
    if (!game.user.isGM) {
        target = game.user.character;
        if (!target && !allowNull) {
            ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.noAssignedPlayerCharacter'));
            return null;
        }
    }
    if (!target && !allowNull) {
        ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.noSelectedToken'));
        return null;
    }
    if (target && target.type !== 'character') {
        if (!allowNull) {
            ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.onlyUseableByPC'));
        }
        return null;
    }

    return target;
};

export const setDiceSoNiceForDualityRoll = async (rollResult, advantageState, hopeFaces, fearFaces, advantageFaces) => {
    if (!game.modules.get('dice-so-nice')?.active) return;
    const diceSoNicePresets = await getDiceSoNicePresets(hopeFaces, fearFaces, advantageFaces, advantageFaces);
    rollResult.dice[0].options = diceSoNicePresets.hope;
    rollResult.dice[1].options = diceSoNicePresets.fear;
    if (rollResult.dice[2] && advantageState) {
        rollResult.dice[2].options =
            advantageState === 1 ? diceSoNicePresets.advantage : diceSoNicePresets.disadvantage;
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

export const tagifyElement = (element, baseOptions, onChange, tagifyOptions = {}) => {
    const { maxTags } = tagifyOptions;
    const options = typeof baseOptions === 'object' ? Object.values(baseOptions) : baseOptions;

    const tagifyElement = new Tagify(element, {
        tagTextProp: 'name',
        enforceWhitelist: true,
        whitelist: options.map(option => {
            return {
                value: option.id,
                name: game.i18n.localize(option.label),
                src: option.src,
                description: option.description
            };
        }),
        maxTags: typeof maxTags === 'function' ? maxTags() : maxTags,
        dropdown: {
            mapValueTo: 'name',
            searchKeys: ['value'],
            enabled: 0,
            maxItems: 100,
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
 * @returns {Promise<foundry.abstract.Document|null>} The resolved document, or null if not found or invalid.
 */
export async function getDocFromElement(element) {
    const target = element.closest('[data-item-uuid]');
    return (await foundry.utils.fromUuid(target.dataset.itemUuid)) ?? null;
}

/**
 * Retrieves a Foundry document associated with the nearest ancestor element
 * that has a `data-item-uuid` attribute.
 * @param {HTMLElement} element - The DOM element to start the search from.
 * @returns {foundry.abstract.Document|null} The resolved document, or null if not found, invalid
 * or in embedded compendium collection.
 */
export function getDocFromElementSync(element) {
    const target = element.closest('[data-item-uuid]');
    try {
        return foundry.utils.fromUuidSync(target.dataset.itemUuid) ?? null;
    } catch (_) {
        return null;
    }
}

/**
 * Adds the update diff on a linkedItem property to update.options for use
 * in _onUpdate via the updateLinkedItemApps function.
 * @param {Array} changedItems            The candidate changed list
 * @param {Array} currentItems            The current list
 * @param {object} options                Additional options which modify the update request
 */
export function addLinkedItemsDiff(changedItems, currentItems, options) {
    if (changedItems) {
        const prevItems = new Set(currentItems);
        const newItems = new Set(changedItems);
        options.toLink = Array.from(
            newItems
                .difference(prevItems)
                .map(item => item?.item ?? item)
                .filter(x => (typeof x === 'object' ? x?.item : x))
        );

        options.toUnlink = Array.from(
            prevItems
                .difference(newItems)
                .map(item => item?.item?.uuid ?? item?.uuid ?? item)
                .filter(x => (typeof x === 'object' ? x?.item : x))
        );
    }
}

/**
 * Adds or removes the current Application from linked document apps
 * depending on an update diff in the linked item list.
 * @param {object} options                Additional options which modify the update requests
 * @param {object} sheet                  The application to add or remove from document apps
 */
export function updateLinkedItemApps(options, sheet) {
    options.toLink?.forEach(featureUuid => {
        const doc = foundry.utils.fromUuidSync(featureUuid);
        doc.apps[sheet.id] = sheet;
    });
    options.toUnlink?.forEach(featureUuid => {
        const doc = foundry.utils.fromUuidSync(featureUuid);
        delete doc.apps[sheet.id];
    });
}

export const itemAbleRollParse = (value, actor, item) => {
    if (!value) return value;

    const isItemTarget = value.toLowerCase().includes('item.@');
    const slicedValue = isItemTarget ? value.replaceAll(/item\.@/gi, '@') : value;
    try {
        return Roll.replaceFormulaData(slicedValue, isItemTarget ? item : actor);
    } catch (_) {
        return '';
    }
};

export const arraysEqual = (a, b) =>
    a.length === b.length &&
    [...new Set([...a, ...b])].every(v => a.filter(e => e === v).length === b.filter(e => e === v).length);

export const setsEqual = (a, b) => a.size === b.size && [...a].every(value => b.has(value));

export function getScrollTextData(resources, resource, key) {
    const { reversed, label } = CONFIG.DH.ACTOR.scrollingTextResource[key];
    const { BOTTOM, TOP } = CONST.TEXT_ANCHOR_POINTS;
    const increased = resources[key].value < resource.value;
    const value = -1 * (resources[key].value - resource.value);

    const text = `${game.i18n.localize(label)} ${value.signedString()}`;

    const stroke = increased ? (reversed ? 0xffffff : 0x000000) : reversed ? 0x000000 : 0xffffff;
    const fill = increased ? (reversed ? 0x0032b1 : 0xffe760) : reversed ? 0xffe760 : 0x0032b1;
    const direction = increased ? (reversed ? BOTTOM : TOP) : reversed ? TOP : BOTTOM;

    return { text, stroke, fill, direction };
}

export function createScrollText(actor, optionsData) {
    if (actor && optionsData?.length) {
        actor.getDependentTokens().forEach(token => {
            optionsData.forEach(data => {
                const { text, ...options } = data;
                canvas.interface.createScrollingText(token.getCenterPoint(), data.text, {
                    duration: 2000,
                    distance: token.h,
                    jitter: 0,
                    ...options
                });
            });
        });
    }
}

export async function createEmbeddedItemWithEffects(actor, baseData, update) {
    const data = baseData.uuid.startsWith('Compendium') ? await foundry.utils.fromUuid(baseData.uuid) : baseData;
    const [doc] = await actor.createEmbeddedDocuments('Item', [
        {
            ...(update ?? data),
            id: data.id,
            uuid: data.uuid,
            effects: data.effects?.map(effect => effect.toObject())
        }
    ]);

    return doc;
}

export async function createEmbeddedItemsWithEffects(actor, baseData) {
    const effectData = [];
    for (let d of baseData) {
        const data = d.uuid.startsWith('Compendium') ? await foundry.utils.fromUuid(d.uuid) : d;
        effectData.push({
            ...data,
            id: data.id,
            uuid: data.uuid,
            effects: data.effects?.map(effect => effect.toObject())
        });
    }

    await actor.createEmbeddedDocuments('Item', effectData);
}

export const slugify = name => {
    return name.toLowerCase().replaceAll(' ', '-').replaceAll('.', '');
};
