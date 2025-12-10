import { getCommandTarget, rollCommandToJSON } from '../helpers/utils.mjs';

export default function DhFateRollEnricher(match, _options) {
    const roll = rollCommandToJSON(match[1], match[0]);
    if (!roll) return match[0];

    const fateTypeFromRoll = getFateType(roll?.type);

    if (fateTypeFromRoll == "BAD") {
        ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.fateParsing') + ". Bad Fate Type. Valid Fate Types are 'Hope' and 'Fear'.");
        return;
    }

    return getFateMessage(roll.result, roll?.flavor);
}

export function getFateType(fateTypeValue) {
    const fateTypeFromValue = fateTypeValue ? 
        (fateTypeValue.toLowerCase() == "fear" ? "Fear" : 
            (fateTypeValue.toLowerCase() == "hope" ? "Hope" : "BAD")) : "Hope";


    return fateTypeFromValue;
}

function getFateMessage(roll, flavor) {
    const fateType = getFateType(roll?.type);
 
    if (fateType == "BAD") {
        ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.fateParsing') + ". Bad Fate Type. Valid Fate Types are 'Hope' and 'Fear'.");
        return '';
    }
    
    const fateTypeLocalized = fateType === "Hope" ? game.i18n.localize("DAGGERHEART.GENERAL.hope") : game.i18n.localize("DAGGERHEART.GENERAL.fear");

    const title = flavor ?? fateTypeLocalized + ' ' + 
        game.i18n.localize('DAGGERHEART.GENERAL.fate') + ' ' + 
        game.i18n.localize('DAGGERHEART.GENERAL.roll');

    const dataLabel = game.i18n.localize('DAGGERHEART.GENERAL.fate');

    const fateElement = document.createElement('span');
    fateElement.innerHTML = `
        <button type="button" class="fate-roll-button${roll?.inline ? ' inline' : ''}"
            data-title="${title}"
            data-label="${dataLabel}"
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
    console.log("button", button);

    const fateTypeFromButton = getFateType(button.dataset?.fatetype);

    if (fateTypeFromButton == "BAD") {
        ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.fateParsing') + ". Bad Fate Type. Valid Fate Types are 'Hope' and 'Fear'.");
        return;
    }

    await enrichedFateRoll(
        {
            target,
            title: button.dataset.title,
            label: button.dataset.label,
            fateType: fateTypeFromButton
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

    config.data = { experiences: {}, traits: {}, fateType: fateType };
    config.source = { actor: target?.uuid };
    await CONFIG.Dice.daggerheart.FateRoll.build(config);
};
