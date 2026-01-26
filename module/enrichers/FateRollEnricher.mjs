import { getCommandTarget, rollCommandToJSON } from '../helpers/utils.mjs';

export default function DhFateRollEnricher(match, _options) {
    const roll = rollCommandToJSON(match[0]);
    if (!roll) return match[0];

    return getFateMessage(roll.result, roll?.flavor);
}

export function getFateTypeData(fateTypeValue) {
    const value = fateTypeValue ? fateTypeValue.capitalize() : 'Hope';
    const lowercased = fateTypeValue?.toLowerCase?.() ?? 'hope';
    switch (lowercased) {
        case 'hope':
        case 'fear':
            return { value, label: game.i18n.localize(`DAGGERHEART.GENERAL.${lowercased}`) };
        default:
            return null;
    }
}

function getFateMessage(roll, flavor) {
    const fateTypeData = getFateTypeData(roll?.type);

    if (!fateTypeData)
        return ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.fateTypeParsing'));

    const { value: fateType, label: fateTypeLabel } = fateTypeData;
    const title = flavor ?? game.i18n.localize('DAGGERHEART.GENERAL.fateRoll');

    const fateElement = document.createElement('span');
    fateElement.innerHTML = `
        <button type="button" class="fate-roll-button${roll?.inline ? ' inline' : ''}"
            data-title="${title}"
            data-label="${fateTypeLabel}"
            data-fateType="${fateType}"
        >
            ${title}
        </button>
    `;

    return fateElement;
}

export const renderFateButton = async event => {
    const button = event.currentTarget,
        target = getCommandTarget({ allowNull: true });

    const fateTypeData = getFateTypeData(button.dataset?.fatetype);

    if (!fateTypeData) ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.fateTypeParsing'));
    const { value: fateType, label: fateTypeLabel } = fateTypeData;

    await enrichedFateRoll(
        {
            target,
            title: button.dataset.title,
            label: button.dataset.label,
            fateType: fateType
        },
        event
    );
};

export const enrichedFateRoll = async ({ target, title, label, fateType }, event) => {
    const config = {
        event: event ?? {},
        title: title,
        headerTitle: label,
        roll: {},
        hasRoll: true,
        fateType: fateType,
        skips: { reaction: true }
    };

    config.data = { experiences: {}, traits: {}, fateType: fateType };
    config.source = { actor: target?.uuid };
    await CONFIG.Dice.daggerheart.FateRoll.build(config);
    return config;
};
