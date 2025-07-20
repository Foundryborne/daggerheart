export default function DhDamageEnricher(match, _options) {
    const parts = match[1].split('|').map(x => x.trim());

    let value = null,
        type = null;

    parts.forEach(part => {
        const split = part.split(':').map(x => x.toLowerCase().trim());
        if (split.length === 2) {
            switch (split[0]) {
                case 'value':
                    value = split[1];
                    break;
                case 'type':
                    type = split[1];
                    break;
            }
        }
    });

    if (!value || !value) return match[0];

    return getDamageMessage(value, type, match[0]);
}

function getDamageMessage(damage, type, defaultElement) {
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
        <button class="enriched-damage-button" 
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
