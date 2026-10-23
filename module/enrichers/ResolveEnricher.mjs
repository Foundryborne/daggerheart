import { nestedReplaceFormulaData } from '../helpers/utils.mjs';
import { parseInlineParams } from './parser.mjs';

/** Similar to lookup, but resolves the data to a value, returning what's in {} on failure as a fallback */
export function DhResolveEnricher(match, { rollData }) {
    const results = parseInlineParams(match[1], { first: 'formula' });
    const element = document.createElement('span');
    const label = match[2];
    try {
        const evaluated = Roll.safeEval(nestedReplaceFormulaData(String(results.formula), rollData));
        element.textContent = results.sign && evaluated >= 0 ? `+${evaluated}` : String(evaluated);
        if (label) element.dataset.tooltip = label;
    } catch {
        element.textContent = label ?? match[1];
    }

    return element;
}
