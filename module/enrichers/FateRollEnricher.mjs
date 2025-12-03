import { getCommandTarget, rollCommandToJSON } from '../helpers/utils.mjs';

export default function DhFateRollEnricher(match, _options) {
    const roll = rollCommandToJSON(match[1], match[0]);
    if (!roll) return match[0];

    return getFateMessage(roll.result, roll?.flavor);
}

function getFateMessage(roll, flavor) {
    const label = flavor ?? 'Fate';
    console.log("ROLL", roll);

    const dataLabel = game.i18n.localize('DAGGERHEART.GENERAL.fate');

    const fateElement = document.createElement('span');
    fateElement.innerHTML = `
        <button type="button" class="fate-roll-button${roll?.inline ? ' inline' : ''}" 
            data-title="${label}"
            data-label="${dataLabel}"
            data-hope="${roll?.hope ?? 'd12'}" 
            ${label}
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
            label: button.dataset.label
        },
        event
    );
};

export const enrichedFateRoll = async (
    { target, title, label },
    event
) => {
    const config = {
        event: event ?? {},
        title: title,
        roll: {
            label: label,
        },
        hasRoll: true
    };

    if (target) {
        await target.diceRoll(config);
    } else {
        // For no target, call FateRoll directly with basic data
        config.data = { experiences: {}, traits: {} };
        config.source = { actor: null };
        await CONFIG.Dice.daggerheart.FateRoll.build(config);
    }
};
