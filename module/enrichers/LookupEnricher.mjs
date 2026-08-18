import { parseInlineParams } from './parser.mjs';

/**
 * Enricher to take a path or string and returns a string.
 * Supports the following parameters:
 * - type - A key of the CONFIG.DH.LOOKUP export. By default, its "text", which means no table
 * - adjustment - a numerical adjustment to go up and down choices
 * - key - a property of the lookup table. If there is no lookup table, it is ignored. Defaults to "label".
 * The label, such as @Lookup[formula]{label}, is shown on a failed lookup if given even if blank
 */
export function DhLookupEnricher(match, { rollData }) {
    const params = parseInlineParams(match[1], { first: 'formula' });
    const element = document.createElement('span');

    // Get parameters and check validity
    const unparsedOriginal = match[0];
    const label = match[2];
    const type = params.type || 'text';
    const table = type !== 'text' ? CONFIG.DH.LOOKUP[type] : null;
    const key = params.key || 'label';
    if (type !== 'text' && !table?.entries) {
        element.textContent = `&lt;Lookup table "${type}" does not exist&gt;`;
        return element;
    }
    
    // Perform lookup/replacement, and handle lookup tables
    const lookupText = Roll.replaceFormulaData(String(params.formula), rollData);
    if (table && lookupText in table.entries) {
        let entry = table.entries[lookupText];
        const adjustment = params.adjustment ? Number(params.adjustment) : null;
        if (Number.isInteger(adjustment)) {
            const keys = Object.keys(table.entries);
            const idx = keys.indexOf(lookupText);
            const newIdx = Math.clamp(idx + adjustment, 0, keys.length - 1);
            entry = table.entries[keys[newIdx]];
        }
        element.textContent = _loc(entry[key] ?? entry.label);
    } else if (lookupText !== params.formula) {
        element.textContent = lookupText;
    } else {
        element.textContent = label ?? unparsedOriginal;
    }

    return element;
}
