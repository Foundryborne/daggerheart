import { fromUuids } from '../helpers/utils.mjs';
import { parseInlineParams } from './parser.mjs';

/** 
 * Enricher to generate a book like table of items. Supports common inventory item types.
 * Supports the following formats.
 * - @EnrichTable[uuid1 uuid2 uuid3 ...]
 * - @EnrichTable[path:path.to.something]
 * - @EnrichTable[rollTable:uuid]
 * For all of them, type:itemType restricts the item type and handles the empty item case.
 * The rollTable format also the following additional params:
 * - min: and max: params control what range is displayed
 * - digits: adds 0 padding to the roll result. If omitted, it figures it out from the highest number
 * For example: @EnrichTable[rollTable:Compendium.daggerheart.rolltables.RollTable.tF04P02yVN1YDVel|min:1|max:13] shows values 1 to 13 of the consumable table
 */
export async function DhEmbedTableEnricher(match) {
    const params = parseInlineParams(match[1], { first: 'uuids' });
    const fromPath = params.path ? foundry.utils.getProperty(globalThis, params.path) : null;

    // If rolltable is set, get it, and check that its valid
    const rollTable = params.rollTable ? await fromUuid(params.rollTable) : null;
    if (params.rollTable && !(rollTable instanceof RollTable)) {
        return createErrorMessage('Roll Table was declared but it does not exist');
    }

    // Fetch items and check that all the types are the same and its valid
    const uuids = rollTable?.results.contents.map(c => c.documentUuid) 
        ?? [...(fromPath ?? []), ...(params.uuids?.split(' ') ?? [])];
    const items = (await fromUuids(uuids)).filter(i => !!i);
    const itemType = params.type ?? items[0]?.type;
    const definition = rowsByItemType[itemType];
    if (!itemType) return createErrorMessage('No items available and no item type to define');
    if (items.some(d => d.type !== itemType)) return createErrorMessage('Not all items match the item type');
    if (!definition) return createErrorMessage('Invalid item type for embed table');
    
    // Create basic table structure
    const element = document.createElement('table');
    element.classList.add('embed-item-table', `${itemType}-table`);
    const head = document.createElement('thead');
    const body = document.createElement('tbody');
    element.append(head, body);

    // Create header using the definition. If its a rolltable, inject a column
    const headerRow = document.createElement('tr');
    head.appendChild(headerRow);
    if (rollTable) {
        const text = _loc('DAGGERHEART.GENERAL.roll');
        headerRow.append(createHtmlElement('th', { text, className: 'roll' }));
    }
    for (const cell of definition.cells) {
        headerRow.append(createHtmlElement('th', { text: _loc(cell.label), className: cell.cssClass }));
    }

    const runData = definition.init?.();
    if (rollTable) {
        const min = params.min ? Number(params.min) : 0;
        const max = params.max ? Number(params.max) : Infinity;
        const numDigits = params.digits ? Number(params.digits) : calculateRollTableDigits(rollTable)
        const itemsByUuid = items.reduce((r, i) => {
            r[i.uuid] = i;
            return r;
        }, {});
        for (const result of rollTable.results) {
            const item = itemsByUuid[result.documentUuid];
            if (!item || result.range[0] > max || result.range[1] < min) continue;

            const row = body.appendChild(document.createElement('tr'));
            const roll = [...new Set(result.range.map(r => String(r).padStart(numDigits, '0')))].join('-');
            row.append(createHtmlElement('td', { text: roll, className: 'roll' }))
            for (const cellDef of definition.cells) {
                const element = createHtmlElement('td', { 
                    [cellDef.html ? 'html' : 'text']: await cellDef.value(item, runData), 
                    className: cellDef.cssClass
                });
                row.append(element);
            }
        }
    } else {
        for (const item of items) {
            const row = body.appendChild(document.createElement('tr'));
            for (const cellDef of definition.cells) {
                const element = createHtmlElement('td', { 
                    [cellDef.html ? 'html' : 'text']: await cellDef.value(item, runData),
                    className: cellDef.cssClass
                });
                row.append(element);
            }
        }
    }


    return element;
}

/** @type {Record<string, { init?: () => unknown; cells: { label: string; cssClass?: string; value: (item: DHItem, init) => string | Promise<string>; html?: boolean }[] }>} */
const rowsByItemType = {
    weapon: {
        init: () => ({ features: CONFIG.DH.ITEM.allWeaponFeatures() }),
        cells: [
            {
                label: 'DAGGERHEART.GENERAL.name',
                cssClass: 'name',
                value: i => i.name
            },
            {
                label: 'DAGGERHEART.GENERAL.Trait.single',
                cssClass: 'trait',
                value: i => _loc(CONFIG.DH.ACTOR.abilities[i.system.attack.roll.trait]?.label)
            },
            {
                label: 'DAGGERHEART.GENERAL.range',
                cssClass: 'range',
                value: i => _loc(CONFIG.DH.GENERAL.templateRanges[i.system.attack.range]?.label) 
            },
            {
                label: 'DAGGERHEART.GENERAL.burden',
                cssClass: 'burden',
                value: i => _loc(CONFIG.DH.GENERAL.burden[i.system.burden]?.label)
            },
            {
                label: 'TYPES.Item.feature',
                cssClass: 'features',
                value: async (item, { features }) => {
                    const itemFeatures = item.system.weaponFeatures.map(x => features[x.value]).filter(x => x);
                    if (!itemFeatures.length) return '—';
                    const TextEditor = foundry.applications.ux.TextEditor;
                    const rollData = item.getRollData();
                    return Promise.all(
                        itemFeatures.map(async f => {
                            const description = await TextEditor.enrichHTML(_loc(f.description), { rollData });
                            return `<div class="feature"><strong>${_loc(f.label)}:</strong> ${description}</div>`;
                        })
                    );
                },
                html: true
            }
        ]
    },
    armor: {
        init: () => ({ features: CONFIG.DH.ITEM.allArmorFeatures() }),
        cells: [
            {
                label: 'DAGGERHEART.GENERAL.name',
                cssClass: 'name',
                value: i => i.name
            },
            {
                label: 'DAGGERHEART.ITEMS.Armor.baseThresholds.base',
                cssClass: 'thresholds',
                value: i => `${i.system.baseThresholds.major} / ${i.system.baseThresholds.severe}`
            },
            {
                label: 'DAGGERHEART.ITEMS.Armor.baseScore',
                cssClass: 'armor-score',
                value: i => i.system.armor.max
            },
            {
                label: 'TYPES.Item.feature',
                cssClass: 'features',
                value: async (i, { features }) => {
                    const itemFeatures = i.system.armorFeatures.map(x => features[x.value]).filter(x => x);
                    if (!itemFeatures.length) return '—';
                    const TextEditor = foundry.applications.ux.TextEditor;
                    const rollData = i.getRollData();
                    return Promise.all(
                        itemFeatures.map(async f => {
                            const description = await TextEditor.enrichHTML(_loc(f.description), { rollData });
                            return `<div class="feature"><strong>${_loc(f.label)}:</strong> ${description}</div>`;
                        })
                    );
                },
                html: true
            }
        ]
    },
    consumable: {
        cells: [
            {
                label: 'DAGGERHEART.GENERAL.name',
                cssClass: 'name',
                value: i => i.name
            },
            {
                label: 'DAGGERHEART.GENERAL.description',
                cssClass: 'description',
                value: i => i.system.getEnrichedDescription(),
                html: true
            }
        ]
    },
    loot: {
        cells: [
            {
                label: 'DAGGERHEART.GENERAL.name',
                cssClass: 'name',
                value: i => i.name
            },
            {
                label: 'DAGGERHEART.GENERAL.description',
                cssClass: 'description',
                value: i => i.system.getEnrichedDescription(),
                html: true
            }
        ]
    }
}

/**
 * 
 * @param {keyof HTMLElementTagNameMap} tagName 
 * @param {*} param1 
 * @returns 
 */
function createHtmlElement(tagName, { text = null, html = null, className = null }) {
    const tag = document.createElement(tagName);
    if (text) tag.textContent = text;
    if (html) tag.innerHTML = html;
    if (className) tag.classList.add(className);
    return tag;
}

function createErrorMessage(message) {
    const div = createHtmlElement('div', { text: message })
    div.classList.add('error');
    return div;
}

/**
 * Returns the number of digits of the highest number in a roll table
 * @param {RollTable} rollTable 
 */
function calculateRollTableDigits(rollTable) {
    const maxResult = rollTable.results.reduce((result, current) => Math.max(result, ...current.range), 0);
    return Math.floor(Math.log10(maxResult)) + 1
}