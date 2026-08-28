import { parseInlineParams } from './parser.mjs';
import { abilityCosts } from '../config/generalConfig.mjs';

const { fear, resource, ...resourceTypes } = abilityCosts;
export function DhDamageEnricher(match, _options) {
    const { value, type, inline } = parseInlineParams(match[1], { first: 'value' });
    
    const allApplicableTypes = ['physical', 'magical', ...Object.keys(resourceTypes)];
    const types = (type ?? '')
        .replace('[', '')
        .replace(']', '')
        .split(',')

    if (!value || !types.every(type => allApplicableTypes.includes(type))) return match[0];

    return getDamageMessage(value, types, inline);
}

function getDamageMessage(damage, types, inline) {
    const iconNodes = types
        .map(x => x.trim())
        .map(x => {
            return CONFIG.DH.GENERAL.damageTypes[x]?.icon ?? null;
        })
        .filter(x => x)
        .map(x => `<i class="fa-solid ${x}"></i>`).join('');

    const dualityElement = document.createElement('span');
    dualityElement.innerHTML = `
        <button type="button" class="enriched-damage-button${inline ? ' inline' : ''}" 
            data-value="${damage}"
            data-type="[${types.join(',')}]"
            data-tooltip="${game.i18n.localize('DAGGERHEART.GENERAL.damage')}"
        >
            ${damage}
            ${iconNodes}
        </button>
    `;

    return dualityElement;
}

export const renderDamageButton = async event => {
    const button = event.target;
    const value = button.dataset.value;
    const types = button.dataset.type
        .replace('[', '')
        .replace(']', '')
        .split(',')
        .map(x => x.trim());

    const damageTypes = types.filter(type => ['physical', 'magical'].includes(type));
    const isDamage = Boolean(damageTypes.length);

    const damageFormula = isDamage ? {
        formula: value,
        applyTo: CONFIG.DH.GENERAL.healingTypes.hitPoints.id,
        damageTypes: damageTypes
    } : null;

    /* The enricher only takes 1 value, so we only use a single type even if multiples are erroneously passed in */
    const resourceFormulas = !isDamage ? [{
        formula: value,
        applyTo: types[0]
    }] : [];

    const config = {
        event: event,
        title: game.i18n.localize('Damage Roll'),
        data: { bonuses: [] },
        source: {},
        hasDamage: true,
        hasTarget: true,
        targets: Array.from(game.user.targets).map(t =>
            game.system.api.fields.ActionFields.TargetField.formatTarget(t)
        ),
        damageFormula,
        resourceFormulas
    };

    CONFIG.Dice.daggerheart.DamageRoll.build(config);
};
