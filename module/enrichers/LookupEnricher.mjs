import { parseInlineParams } from './parser.mjs';

export default function DhLookupEnricher(match, { rollData }) {
    const results = parseInlineParams(match[1], { first: 'formula'});
    const element = document.createElement('span');
    element.textContent = Roll.replaceFormulaData(String(results.formula), rollData);
    return element;
}
