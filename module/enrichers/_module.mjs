import { default as DhDamageEnricher, renderDamageButton } from './DamageEnricher.mjs';
import { default as DhDualityRollEnricher, renderDualityButton } from './DualityRollEnricher.mjs';
import { default as DhFateRollEnricher, renderFateButton } from './FateRollEnricher.mjs';
import { default as DhEffectEnricher } from './EffectEnricher.mjs';
import { default as DhTemplateEnricher, renderMeasuredTemplate } from './TemplateEnricher.mjs';
import { default as DhLookupEnricher } from './LookupEnricher.mjs';

export { DhDamageEnricher, DhDualityRollEnricher, DhEffectEnricher, DhTemplateEnricher, DhFateRollEnricher };

export const enricherConfig = [
    {
        pattern: /@Damage\[([^\[\]]*)\]({[^}]*})?/g,
        enricher: DhDamageEnricher
    },
    {
        pattern: /\[\[\/dr\s?(.*?)\]\]({[^}]*})?/g,
        enricher: DhDualityRollEnricher
    },
    {
        pattern: /\[\[\/fr\s?(.*?)\]\]({[^}]*})?/g,
        enricher: DhFateRollEnricher
    },
    {
        pattern: /@Effect\[([^\[\]]*)\]({[^}]*})?/g,
        enricher: DhEffectEnricher
    },
    {
        pattern: /@Template\[([^\[\]]*)\]({[^}]*})?/g,
        enricher: DhTemplateEnricher
    },
    {
        pattern: /@Lookup\[([^\[\]]*)\]({[^}]*})?/g,
        enricher: DhLookupEnricher
    }
];

export const enricherRenderSetup = element => {
    const clickWrapper = func => event => {
        event.stopPropagation();
        func(event);
    };   

    element
        .querySelectorAll('.enriched-damage-button')
        .forEach(element => element.addEventListener('click', clickWrapper(renderDamageButton)));

    element
        .querySelectorAll('.duality-roll-button')
        .forEach(element => element.addEventListener('click', clickWrapper(renderDualityButton)));

    element
        .querySelectorAll('.fate-roll-button')
        .forEach(element => element.addEventListener('click', clickWrapper(renderFateButton)));

    element
        .querySelectorAll('.measured-template-button')
        .forEach(element => element.addEventListener('click', clickWrapper(renderMeasuredTemplate)));
};
