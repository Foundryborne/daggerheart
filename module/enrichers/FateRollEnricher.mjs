import { getCommandTarget, rollCommandToJSON } from '../helpers/utils.mjs';

export default function DhFateRollEnricher(match, _options) {
    console.log("match", match);
    const roll = rollCommandToJSON(match[1], match[0]);
    if (!roll) return match[0];
    console.log("roll", roll);

    return getFateMessage(roll.result, roll?.flavor);
}

function getFateMessage(roll, flavor) {
    console.log("roll", roll);
    const label = flavor ?? 'Fate';
    const fateType = roll?.type ?? 'Hope'

    const dataLabel = game.i18n.localize('DAGGERHEART.GENERAL.fate');

    const fateElement = document.createElement('span');
    fateElement.innerHTML = `
        <button type="button" class="fate-roll-button${roll?.inline ? ' inline' : ''}"
            data-title="${label}"
            data-label="${dataLabel}"
            data-fateType="${fateType}"
        >
            ${fateType} ${label} Roll
        </button>
    `;

    return fateElement;
}

export const renderFateButton = async event => {
    const button = event.currentTarget,
        target = getCommandTarget({ allowNull: true });

    await enrichedFateRoll(
        {
            target,
            title: button.dataset.title,
            label: button.dataset.label,
            fateType: button.dataset.fateType
        },
        event
    );
};

export const enrichedFateRoll = async (
    { target, title, label, fateType },
    event
) => {
    const config = {
        event: event ?? {},
        title: title,
        roll: {
            label: label,
        },
        hasRoll: true,
        fateType: fateType
    };

    if (target) {
        await target.diceRoll(config);
    } else {
        // For no target, call FateRoll directly with basic data
        config.data = { experiences: {}, traits: {}, fateType: fateType };
        config.source = { actor: null };
        await CONFIG.Dice.daggerheart.FateRoll.build(config);
    }
};
