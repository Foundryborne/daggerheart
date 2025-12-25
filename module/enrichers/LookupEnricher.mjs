import { parseInlineParams } from './parser.mjs';

export default function DhLookupEnricher(match, { rollData }) {
    const lookupParam = match[1];
    const element = document.createElement('span');
    element.textContent = match[0];
    if (rollData && lookupParam) {
        const results = parseInlineParams(match[1], { first: 'formula' });
        const text = Roll.replaceFormulaData(String(results.formula), rollData);
        element.textContent = text !== lookupParam ? text : element.textContent;
    }

    return element;
}
