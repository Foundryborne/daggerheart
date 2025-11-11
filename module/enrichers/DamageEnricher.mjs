import { parseInlineParams } from './parser.mjs';

export default function DhDamageEnricher(match, _options) {
    const { value, type, inline } = parseInlineParams(match[1]);
    if (!value || !type) return match[0];
    return getDamageMessage(value, type, inline, match[0]);
}

function getDamageMessage(damage, type, inline, defaultElement) {
    const typeIcons = type
        .replace('[', '')
        .replace(']', '')
        .split(',')
        .map(x => x.trim())
        .map(x => {
            return CONFIG.DH.GENERAL.damageTypes[x]?.icon ?? null;
        })
        .filter(x => x);

    if (!typeIcons.length) return defaultElement;

    const iconNodes = typeIcons.map(x => `<i class="fa-solid ${x}"></i>`).join('');

    const dualityElement = document.createElement('span');
    dualityElement.innerHTML = `
        <button type="button" class="enriched-damage-button${inline ? ' inline' : ''}" 
            data-value="${damage}"
            data-type="${type}"
            data-tooltip="${game.i18n.localize('DAGGERHEART.GENERAL.damage')}"
        >
            ${damage}
            ${iconNodes}
        </button>
    `;

    return dualityElement;
}

export const renderDamageButton = async event => {
    const button = event.currentTarget,
        value = button.dataset.value,
        type = button.dataset.type
            .replace('[', '')
            .replace(']', '')
            .split(',')
            .map(x => x.trim());

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
        roll: [
            {
                formula: value,
                applyTo: CONFIG.DH.GENERAL.healingTypes.hitPoints.id,
                type: type
            }
        ]
    };

    CONFIG.Dice.daggerheart.DamageRoll.build(config);
};
