import { fromUuids } from '../helpers/utils.mjs';
import { parseInlineParams } from './parser.mjs';

export async function DhEmbedTableEnricher(match) {
    const results = parseInlineParams(match[1], { first: 'uuids' });
    const fromPath = results.path ? foundry.utils.getProperty(globalThis, results.path) : null;
    const uuids = [...(fromPath ?? []), ...(results.uuids?.split(' ') ?? [])];
    const items = (await fromUuids(uuids)).filter(i => !!i);

    const itemType = results.type ?? items[0]?.type;
    const definition = rowsByItemType[itemType];
    if (!itemType) return createErrorMessage('No items available and no item type to define');
    if (items.some(d => d.type !== itemType)) return createErrorMessage('Not all items match the item type');
    if (!definition) return createErrorMessage('Invalid item type for embed table');

    
    const element = document.createElement('table');
    element.classList.add('embed-item-table', `${itemType}-table`);
    const head = document.createElement('thead');
    const body = document.createElement('tbody');
    element.append(head, body);

    const headerRow = document.createElement('tr');
    head.appendChild(headerRow);
    for (const cell of definition.cells) {
        headerRow.append(createHtmlElement('th', { text: _loc(cell.label) }));
    }

    const runData = definition.init?.();
    for (const item of items) {
        const row = body.appendChild(document.createElement('tr'));
        for (const cell of definition.cells) {
            const key = cell.html ? 'html' : 'text';
            row.append(createHtmlElement('td', { [key]: await cell.value(item, runData) }));
        }
    }

    return element;
}

/** @type {Record<string, { init?: () => unknown; cells: { label: string; value: (item: DHItem, init) => string | Promise<string>; html?: boolean }[] }>} */
const rowsByItemType = {
    weapon: {
        init: () => ({ features: CONFIG.DH.ITEM.allWeaponFeatures() }),
        cells: [
            {
                label: 'DAGGERHEART.GENERAL.name',
                value: i => i.name
            },
            {
                label: 'DAGGERHEART.GENERAL.Trait.single',
                value: i => _loc(CONFIG.DH.ACTOR.abilities[i.system.attack.roll.trait]?.label)
            },
            {
                label: 'DAGGERHEART.GENERAL.range',
                value: i => _loc(CONFIG.DH.GENERAL.templateRanges[i.system.attack.range]?.label) 
            },
            {
                label: 'DAGGERHEART.GENERAL.burden',
                value: i => _loc(CONFIG.DH.GENERAL.burden[i.system.burden]?.label)
            },
            {
                label: 'TYPES.Item.feature',
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
                value: i => i.name
            },
            {
                label: 'DAGGERHEART.ITEMS.Armor.baseThresholds.base',
                value: i => `${i.system.baseThresholds.major} / ${i.system.baseThresholds.severe}`
            },
            {
                label: 'DAGGERHEART.ITEMS.Armor.baseScore',
                value: i => i.system.armor.max
            },
            {
                label: 'TYPES.Item.feature',
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
    }
}

/**
 * 
 * @param {keyof HTMLElementTagNameMap} tagName 
 * @param {*} param1 
 * @returns 
 */
function createHtmlElement(tagName, { text = null, html = null }) {
    const tag = document.createElement(tagName);
    if (text) tag.textContent = text;
    if (html) tag.innerHTML = html;
    return tag;
}

function createErrorMessage(message) {
    const div = createHtmlElement('div', { text: message })
    div.classList.add('error');
    return div;
}