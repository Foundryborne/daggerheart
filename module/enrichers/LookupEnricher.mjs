import { parseInlineParams } from './parser.mjs';

export default function DhLookupEnricher(match, { rollData }) {
    const results = parseInlineParams(match[1], { first: 'formula' });
    const element = document.createElement('span');

    const lookupCommand = match[0];
    const lookupParam = match[1];
    const lookupText = Roll.replaceFormulaData(String(results.formula), rollData);
    element.textContent = lookupText === lookupParam ? lookupCommand : lookupText;

    return element;
}
