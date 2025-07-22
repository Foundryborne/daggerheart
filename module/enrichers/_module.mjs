import { default as DhDamageEnricher, renderDamageButton } from './DamageEnricher.mjs';
import { default as DhDualityRollEnricher, renderDualityButton } from './DualityRollEnricher.mjs';
import { default as DhEffectEnricher } from './EffectEnricher.mjs';
import { default as DhTemplateEnricher, renderMeasuredTemplate } from './TemplateEnricher.mjs';

export { DhDamageEnricher, DhDualityRollEnricher, DhEffectEnricher, DhTemplateEnricher };

export const enricherConfig = [
    {
        pattern: /^@Damage\[(.*)\]$/g,
        enricher: DhDamageEnricher
    },
    {
        pattern: /\[\[\/dr\s?(.*?)\]\]/g,
        enricher: DhDualityRollEnricher
    },
    {
        pattern: /^@Effect\[(.*)\]$/g,
        enricher: DhEffectEnricher
    },
    {
        pattern: /^@Template\[(.*)\]$/g,
        enricher: DhTemplateEnricher
    }
];

export const enricherRenderSetup = element => {
    element
        .querySelectorAll('.enriched-damage-button')
        .forEach(element => element.addEventListener('click', renderDamageButton));

    element
        .querySelectorAll('.duality-roll-button')
        .forEach(element => element.addEventListener('click', renderDualityButton));

    element
        .querySelectorAll('.measured-template-button')
        .forEach(element => element.addEventListener('click', renderMeasuredTemplate));

    // element
    //     .querySelectorAll('.enriched-effect')
    //     .forEach(element => element.addEventListener('dragstart', dragEnrichedEffect));
};
