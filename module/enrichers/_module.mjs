import { DhDamageEnricher, renderDamageButton } from './DamageEnricher.mjs';
import { DhDualityRollEnricher, renderDualityButton } from './DualityRollEnricher.mjs';
import { DhFateRollEnricher, renderFateButton } from './FateRollEnricher.mjs';
import { DhEffectEnricher } from './EffectEnricher.mjs';
import { DhTemplateEnricher, renderMeasuredTemplate } from './TemplateEnricher.mjs';
import { DhLookupEnricher } from './LookupEnricher.mjs';
import { DhResolveEnricher } from './ResolveEnricher.mjs';
import { DhEmbedTableEnricher } from './EmbedTableEnricher.mjs';

export { DhDamageEnricher, DhDualityRollEnricher, DhEffectEnricher, DhTemplateEnricher, DhFateRollEnricher };

// @todo standardize enricher regex and use match labels
export const enricherConfig = [
    {
        pattern: /@Damage\[([^[\]]*)\](?:{([^}]*)})?/g,
        enricher: DhDamageEnricher
    },
    {
        pattern: /\[\[\/dr\s?(.*?)\]\](?:{([^}]*)})?/g,
        enricher: DhDualityRollEnricher
    },
    {
        pattern: /\[\[\/fr\s?(.*?)\]\](?:{([^}]*)})?/g,
        enricher: DhFateRollEnricher
    },
    {
        pattern: /@Effect\[([^[\]]*)\](?:{([^}]*)})?/g,
        enricher: DhEffectEnricher
    },
    {
        pattern: /@Template\[([^[\]]*)\](?:{([^}]*)})?/g,
        enricher: DhTemplateEnricher
    },
    {
        pattern: /@Lookup\[([^[\]]*)\](?:{([^}]*)})?/g,
        enricher: DhLookupEnricher
    },
    {
        pattern: /@Resolve\[([^[\]]*)\](?:{([^}]*)})?/g,
        enricher: DhResolveEnricher
    },
    {
        pattern: /@EmbedTable\[([^[\]]*)\]/g,
        enricher: DhEmbedTableEnricher
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
