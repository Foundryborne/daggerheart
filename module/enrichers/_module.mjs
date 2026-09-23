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

/** 
 * Setups up a listener for inline roll links on the element. Should be called on window.document and any popout windows.
 * @param {HTMLDocument} element
 */
export function enricherRenderSetup(element) {
    element.addEventListener('click', event => {
        if (event.target.closest('.enriched-damage-button')) {
            event.stopPropagation();
            return renderDamageButton(event);
        } else if (event.target.closest('.duality-roll-button')) {
            event.stopPropagation();
            return renderDualityButton(event);
        } else if (event.target.closest('.fate-roll-button')) {
            event.stopPropagation();
            return renderFateButton(event);
        } else if (event.target.closest('.measured-template-button')) {
            event.stopPropagation();
            return renderMeasuredTemplate(event);
        }
    }, { passive: true });
}
