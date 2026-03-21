import { diceTypes, getDiceSoNicePresets, getDiceSoNicePreset, range } from '../config/generalConfig.mjs';
import Tagify from '@yaireo/tagify';

export const capitalize = string => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

export function rollCommandToJSON(text) {
    if (!text) return {};

    const flavorMatch = text?.match(/{(.*)}$/);
    const flavor = flavorMatch ? flavorMatch[1] : null;

    // Match key="quoted string"  OR  key=unquotedValue
    const PAIR_RE = /(\w+)\s*=\s*("(?:[^"\\]|\\.)*"|[^\]\}\s]+)/g; //updated regex to allow escaped quotes in quoted strings and avoid matching closing brackets/braces
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
    return { result, flavor };
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
    const diceSoNicePresets = await getDiceSoNicePresets(
        rollResult,
        hopeFaces,
        fearFaces,
        advantageFaces,
        advantageFaces
    );
    rollResult.dice[0].options = diceSoNicePresets.hope;
    rollResult.dice[1].options = diceSoNicePresets.fear;
    if (rollResult.dice[2] && advantageState) {
        rollResult.dice[2].options =
            advantageState === 1 ? diceSoNicePresets.advantage : diceSoNicePresets.disadvantage;
    }
};

export const setDiceSoNiceForHopeFateRoll = async (rollResult, hopeFaces) => {
    if (!game.modules.get('dice-so-nice')?.active) return;
    const { diceSoNice } = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.appearance);
    const diceSoNicePresets = await getDiceSoNicePreset(diceSoNice.hope, hopeFaces);
    rollResult.dice[0].options = diceSoNicePresets;
};

export const setDiceSoNiceForFearFateRoll = async (rollResult, fearFaces) => {
    if (!game.modules.get('dice-so-nice')?.active) return;
    const { diceSoNice } = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.appearance);
    const diceSoNicePresets = await getDiceSoNicePreset(diceSoNice.fear, fearFaces);
    rollResult.dice[0].options = diceSoNicePresets;
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
    const options = Array.isArray(baseOptions)
        ? baseOptions
        : Object.keys(baseOptions).map(optionKey => ({
              ...baseOptions[optionKey],
              id: optionKey
          }));

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
            searchKeys: ['value', 'name'],
            mapValueTo: 'name',
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
                            data-tooltip="${tagData.description ? htmlToText(tagData.description) : tagData.name}"
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
                acc[`${key}.${innerProperty}`] = _del;
            }
        } else {
            acc[`${key}`] = _del;
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

foundry.utils.setProperty(foundry, 'dice.terms.Die.MODIFIERS.sc', 'selfCorrecting');

/**
 * Return the configured value as result if 1 is rolled
 * Example: 6d6sc6  Roll 6d6, each result of 1 will be changed into 6
 * @param {string} modifier     The matched modifier query
 */
foundry.dice.terms.Die.prototype.selfCorrecting = function (modifier) {
    const rgx = /(?:sc)([0-9]+)/i;
    const match = modifier.match(rgx);
    if (!match) return false;
    let [target] = match.slice(1);
    target = parseInt(target);
    for (const r of this.results) {
        if (r.result === 1) {
            r.result = target;
        }
    }
};

export const getDamageKey = damage => {
    return ['none', 'minor', 'major', 'severe', 'massive', 'any'][damage];
};

export const getDamageLabel = damage => {
    return game.i18n.localize(`DAGGERHEART.GENERAL.Damage.${getDamageKey(damage)}`);
};

export const damageKeyToNumber = key => {
    return {
        none: 0,
        minor: 1,
        major: 2,
        severe: 3,
        massive: 4,
        any: 5
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

/**
 *
 * @param {DhActor} actor - The actor for which all tokens will run a data update.
 * @param {string} update - The data update to be applied to all tokens.
 * @param {func} updateToken - Optional, specific data update for the non-prototype tokens as a function using the token data. Useful to handle wildcard images where each token has a different image but the prototype has a wildcard path.
 */
export const updateActorTokens = async (actor, update, updateToken) => {
    await actor.prototypeToken.update({ ...update });

    /* Update the tokens in all scenes belonging to Actor */
    for (let token of actor.getDependentTokens()) {
        const tokenActor = token.baseActor ?? token.actor;
        if (token.id && tokenActor?.id === actor.id) {
            await token.update({
                ...(updateToken ? updateToken(token) : update),
                _id: token.id
            });
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
    const model = isItemTarget ? item : actor;

    try {
        return Roll.replaceFormulaData(slicedValue, isItemTarget || !model?.getRollData ? model : model.getRollData());
    } catch (_) {
        return '';
    }
};

export const arraysEqual = (a, b) =>
    a.length === b.length &&
    [...new Set([...a, ...b])].every(v => a.filter(e => e === v).length === b.filter(e => e === v).length);

export const setsEqual = (a, b) => a.size === b.size && [...a].every(value => b.has(value));

export function getScrollTextData(actor, resource, key) {
    const { BOTTOM, TOP } = CONST.TEXT_ANCHOR_POINTS;

    const resources = actor.system.resources;
    const increased = resources[key].value < resource.value;
    const value = -1 * (resources[key].value - resource.value);
    const { label, isReversed } = resources[key];

    const text = `${game.i18n.localize(label)} ${value.signedString()}`;
    const stroke = increased ? (isReversed ? 0xffffff : 0x000000) : isReversed ? 0x000000 : 0xffffff;
    const fill = increased ? (isReversed ? 0x0032b1 : 0xffe760) : isReversed ? 0xffe760 : 0x0032b1;
    const direction = increased ? (isReversed ? BOTTOM : TOP) : isReversed ? TOP : BOTTOM;

    return { text, stroke, fill, direction };
}

export function createScrollText(actor, data) {
    if (actor) {
        actor.getActiveTokens().forEach(token => {
            const { text, ...options } = data;
            canvas.interface.createScrollingText(token.getCenterPoint(), data.text, {
                duration: 2000,
                distance: token.h,
                jitter: 0,
                ...options
            });
        });
    }
}

export async function createEmbeddedItemWithEffects(actor, baseData, update) {
    const data = baseData.uuid.startsWith('Compendium') ? await foundry.utils.fromUuid(baseData.uuid) : baseData;
    const [doc] = await actor.createEmbeddedDocuments('Item', [
        {
            ...(update ?? data),
            ...baseData,
            id: data.id,
            uuid: data.uuid,
            _uuid: data.uuid,
            effects: data.effects?.map(effect => effect.toObject()),
            _stats: {
                ...data._stats,
                compendiumSource: data.pack ? `Compendium.${data.pack}.Item.${data.id}` : null
            }
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

export function shuffleArray(array) {
    let currentIndex = array.length;
    while (currentIndex != 0) {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }

    return array;
}

export function itemIsIdentical(a, b) {
    const compendiumSource = a._stats.compendiumSource === b._stats.compendiumSource;
    const name = a.name === b.name;
    const description = a.system.description === b.system.description;

    return compendiumSource && name & description;
}

export async function waitForDiceSoNice(message) {
    if (message && game.modules.get('dice-so-nice')?.active) {
        await game.dice3d.waitFor3DAnimationByMessageID(message.id);
    }
}

export function refreshIsAllowed(allowedTypes, typeToCheck) {
    if (!allowedTypes) return true;

    switch (typeToCheck) {
        case CONFIG.DH.GENERAL.refreshTypes.scene.id:
        case CONFIG.DH.GENERAL.refreshTypes.session.id:
        case CONFIG.DH.GENERAL.refreshTypes.longRest.id:
            return allowedTypes.includes?.(typeToCheck) ?? allowedTypes.has(typeToCheck);
        case CONFIG.DH.GENERAL.refreshTypes.shortRest.id:
            return allowedTypes.some(
                x =>
                    x === CONFIG.DH.GENERAL.refreshTypes.shortRest.id ||
                    x === CONFIG.DH.GENERAL.refreshTypes.longRest.id
            );
        default:
            return false;
    }
}

function expireActiveEffectIsAllowed(allowedTypes, typeToCheck) {
    if (typeToCheck === CONFIG.DH.GENERAL.activeEffectDurations.act.id) return true;

    return refreshIsAllowed(allowedTypes, typeToCheck);
}

export function expireActiveEffects(actor, allowedTypes = null) {
    const shouldExpireEffects = game.settings.get(
        CONFIG.DH.id,
        CONFIG.DH.SETTINGS.gameSettings.Automation
    ).autoExpireActiveEffects;
    if (!shouldExpireEffects) return;

    const effectsToExpire = actor
        .getActiveEffects()
        .filter(effect => {
            if (!effect.system?.duration.type) return false;

            const { temporary, custom } = CONFIG.DH.GENERAL.activeEffectDurations;
            if ([temporary.id, custom.id].includes(effect.system.duration.type)) return false;

            return expireActiveEffectIsAllowed(allowedTypes, effect.system.duration.type);
        })
        .map(x => x.id);

    actor.deleteEmbeddedDocuments('ActiveEffect', effectsToExpire);
}

export async function getCritDamageBonus(formula) {
    const critRoll = new Roll(formula);
    await critRoll.evaluate();
    return critRoll.dice.reduce((acc, dice) => acc + dice.faces * dice.results.filter(r => r.active).length, 0);
}

export function htmlToText(html) {
    var tempDivElement = document.createElement('div');
    tempDivElement.innerHTML = html;

    return tempDivElement.textContent || tempDivElement.innerText || '';
}

export function getIconVisibleActiveEffects(effects) {
    return effects.filter(effect => {
        if (!(effect instanceof game.system.api.documents.DhActiveEffect)) return true;

        const alwaysShown = effect.showIcon === CONST.ACTIVE_EFFECT_SHOW_ICON.ALWAYS;
        const conditionalShown = effect.showIcon === CONST.ACTIVE_EFFECT_SHOW_ICON.CONDITIONAL && !effect.transfer; // TODO: system specific logic

        return !effect.disabled && (alwaysShown || conditionalShown);
    });
}
export async function getFeaturesHTMLData(features) {
    const result = [];
    for (const feature of features) {
        if (feature) {
            const base = feature.item ?? feature;
            const item = base.system ? base : await foundry.utils.fromUuid(base.uuid);
            const itemDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
                item.system.description
            );
            result.push({ label: item.name, description: itemDescription });
        }
    }

    return result;
}

/**
 * Given a simple flavor-less formula with only +/- operators, returns a list of damage partial terms.
 * All subtracted terms become negative terms.
 * If there are no dice, it returns 0d1 for that term.
 */
export function parseTermsFromSimpleFormula(formula) {
    const roll = formula instanceof Roll ? formula : new Roll(formula);

    // Parse from right to left so that when we hit an operator, we already have the term.
    return roll.terms.reduceRight((result, term) => {
        // Ignore + terms, we assume + by default
        if (term.expression === ' + ') return result;

        // - terms modify the last term we parsed
        if (term.expression === ' - ') {
            const termToModify = result[0];
            if (termToModify) {
                if (termToModify.bonus) termToModify.bonus *= -1;
                if (termToModify.dice) termToModify.dice *= -1;
            }
            return result;
        }

        result.unshift({
            bonus: term instanceof foundry.dice.terms.NumericTerm ? term.number : 0,
            diceQuantity: term instanceof foundry.dice.terms.Die ? term.number : 0,
            faces: term.faces ?? 1
        });

        return result;
    }, []);
}

/**
 * Calculates the expectede value from a formula or the results of parseTermsFromSimpleFormula.
 * @returns {number} the average result of rolling the given dice
 */
export function calculateExpectedValue(formulaOrTerms) {
    const terms = Array.isArray(formulaOrTerms)
        ? formulaOrTerms
        : typeof formulaOrTerms === 'string'
          ? parseTermsFromSimpleFormula(formulaOrTerms)
          : [formulaOrTerms];
    return terms.reduce((r, t) => r + (t.bonus ?? 0) + (t.diceQuantity ? (t.diceQuantity * (t.faces + 1)) / 2 : 0), 0);
}

export function parseRallyDice(value, effect) {
    const legacyStartsWithPrefix = value.toLowerCase().startsWith('d');
    const workingValue = legacyStartsWithPrefix ? value.slice(1) : value;
    const dataParsedValue = itemAbleRollParse(workingValue, effect.parent);

    return `d${game.system.api.documents.DhActiveEffect.effectSafeEval(dataParsedValue)}`;
}
/**
 * Refreshes character and/or adversary resources.
 * @param { string[] } refreshTypes Which type of features to refresh using IDs from CONFIG.DH.GENERAL.refreshTypes
 * @param { string[] = ['character', 'adversary'] } actorTypes Which actor types should refresh their features. Defaults to character and adversary.
 * @param { boolean = true } sendRefreshMessage If a chat message should be created detailing the refresh
 * @return { Actor[] } The actors that had their features refreshed
 */
export async function RefreshFeatures(
    refreshTypes = [],
    actorTypes = ['character', 'adversary'],
    sendNotificationMessage = true,
    sendRefreshMessage = true
) {
    const refreshedActors = {};
    for (let actor of game.actors) {
        if (actorTypes.includes(actor.type) && actor.prototypeToken.actorLink) {
            expireActiveEffects(actor, refreshTypes);

            const updates = {};
            for (let item of actor.items) {
                if (
                    item.system.metadata?.hasResource &&
                    refreshIsAllowed(refreshTypes, item.system.resource?.recovery)
                ) {
                    if (!refreshedActors[actor.id])
                        refreshedActors[actor.id] = { name: actor.name, img: actor.img, refreshed: new Set() };
                    refreshedActors[actor.id].refreshed.add(
                        game.i18n.localize(CONFIG.DH.GENERAL.refreshTypes[item.system.resource.recovery].label)
                    );

                    if (!updates[item.id]?.system) updates[item.id] = { system: {} };

                    const increasing =
                        item.system.resource.progression === CONFIG.DH.ITEM.itemResourceProgression.increasing.id;
                    updates[item.id].system = {
                        ...updates[item.id].system,
                        'resource.value': increasing
                            ? 0
                            : game.system.api.documents.DhActiveEffect.effectSafeEval(
                                  Roll.replaceFormulaData(item.system.resource.max, actor.getRollData())
                              )
                    };
                }
                if (item.system.metadata?.hasActions) {
                    const usedTypes = new Set();
                    const actions = item.system.actions.filter(action => {
                        if (refreshIsAllowed(refreshTypes, action.uses.recovery)) {
                            usedTypes.add(action.uses.recovery);
                            return true;
                        }

                        return false;
                    });
                    if (actions.length === 0) continue;

                    if (!refreshedActors[actor.id])
                        refreshedActors[actor.id] = { name: actor.name, img: actor.img, refreshed: new Set() };
                    refreshedActors[actor.id].refreshed.add(
                        ...usedTypes.map(type => game.i18n.localize(CONFIG.DH.GENERAL.refreshTypes[type].label))
                    );

                    if (!updates[item.id]?.system) updates[item.id] = { system: {} };

                    updates[item.id].system = {
                        ...updates[item.id].system,
                        ...actions.reduce(
                            (acc, action) => {
                                acc.actions[action.id] = { 'uses.value': 0 };
                                return acc;
                            },
                            { actions: updates[item.id].system.actions ?? {} }
                        )
                    };
                }
            }

            for (let key in updates) {
                const update = updates[key];
                await actor.items.get(key).update(update);
            }
        }
    }

    const types = refreshTypes.map(x => game.i18n.localize(CONFIG.DH.GENERAL.refreshTypes[x].label)).join(', ');

    if (sendNotificationMessage) {
        ui.notifications.info(
            game.i18n.format('DAGGERHEART.UI.Notifications.gmMenuRefresh', {
                types: `[${types}]`
            })
        );
    }

    if (sendRefreshMessage) {
        const cls = getDocumentClass('ChatMessage');
        const msg = {
            user: game.user.id,
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/ui/chat/refreshMessage.hbs',
                {
                    types: types
                }
            ),
            title: game.i18n.localize('DAGGERHEART.UI.Chat.refreshMessage.title'),
            speaker: cls.getSpeaker()
        };

        cls.create(msg);
    }

    return refreshedActors;
}

export function getUnusedDamageTypes(parts) {
    const usedKeys = Object.keys(parts);
    return Object.keys(CONFIG.DH.GENERAL.healingTypes).reduce((acc, key) => {
        if (!usedKeys.includes(key))
            acc.push({
                value: key,
                label: game.i18n.localize(CONFIG.DH.GENERAL.healingTypes[key].label)
            });

        return acc;
    }, []);
}

/** Returns resolved armor sources ordered by application order */
export function getArmorSources(actor) {
    const rawArmorSources = Array.from(actor.allApplicableEffects()).filter(x => x.system.armorData);
    if (actor.system.armor) rawArmorSources.push(actor.system.armor);

    const data = rawArmorSources.map(doc => {
        // Get the origin item. Since the actor is already loaded, it should already be cached
        // Consider the relative function versions if this causes an issue
        const isItem = doc instanceof Item;
        const origin = isItem ? doc : doc.origin ? foundry.utils.fromUuidSync(doc.origin) : doc.parent;
        return {
            origin,
            name: origin.name,
            document: doc,
            data: doc.system.armor ?? doc.system.armorData,
            disabled: !!doc.disabled || !!doc.isSuppressed
        };
    });

    return sortBy(data, ({ origin }) => {
        switch (origin?.type) {
            case 'class':
            case 'subclass':
            case 'ancestry':
            case 'community':
            case 'feature':
            case 'domainCard':
                return 2;
            case 'loot':
            case 'consumable':
                return 3;
            case 'character':
                return 4;
            case 'weapon':
                return 5;
            case 'armor':
                return 6;
            default:
                return 1;
        }
    });
}

/**
 * Returns an array sorted by a function that returns a thing to compare, or an array to compare in order
 * Similar to lodash's sortBy function.
 */
export function sortBy(arr, fn) {
    const directCompare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
    const cmp = (a, b) => {
        const resultA = fn(a);
        const resultB = fn(b);
        if (Array.isArray(resultA) && Array.isArray(resultB)) {
            for (let idx = 0; idx < Math.min(resultA.length, resultB.length); idx++) {
                const result = directCompare(resultA[idx], resultB[idx]);
                if (result !== 0) return result;
            }
            return 0;
        }
        return directCompare(resultA, resultB);
    };
    return arr.sort(cmp);
}
