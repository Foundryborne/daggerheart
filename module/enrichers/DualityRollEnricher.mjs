import { abilities } from '../config/actorConfig.mjs';
import { getCommandTarget, rollCommandToJSON } from '../helpers/utils.mjs';

export default function DhDualityRollEnricher(match, _options) {
    const roll = rollCommandToJSON(match[1]);
    if (!roll) return match[0];

    return getDualityMessage(roll);
}

function getDualityMessage(roll) {
    const traitLabel =
        roll.trait && abilities[roll.trait]
            ? game.i18n.format('DAGGERHEART.GENERAL.check', {
                  check: game.i18n.localize(abilities[roll.trait].label)
              })
            : null;

    const label = traitLabel ?? game.i18n.localize('DAGGERHEART.GENERAL.duality');
    const dataLabel = traitLabel
        ? game.i18n.localize(abilities[roll.trait].label)
        : game.i18n.localize('DAGGERHEART.GENERAL.duality');

    const advantage = roll.advantage
        ? CONFIG.DH.ACTIONS.advandtageState.advantage.value
        : roll.disadvantage
          ? CONFIG.DH.ACTIONS.advandtageState.disadvantage.value
          : undefined;
    const advantageLabel =
        advantage === CONFIG.DH.ACTIONS.advandtageState.advantage.value
            ? 'Advantage'
            : advantage === CONFIG.DH.ACTIONS.advandtageState.disadvantage.value
              ? 'Disadvantage'
              : undefined;

    const dualityElement = document.createElement('span');
    dualityElement.innerHTML = `
        <button class="duality-roll-button" 
            data-title="${label}"
            data-label="${dataLabel}"
            data-hope="${roll.hope ?? 'd12'}" 
            data-fear="${roll.fear ?? 'd12'}"
            ${advantage ? `data-advantage="${advantage}"` : ''}
            ${roll.difficulty !== undefined ? `data-difficulty="${roll.difficulty}"` : ''}
            ${roll.trait && abilities[roll.trait] ? `data-trait="${roll.trait}"` : ''}
            ${roll.advantage ? 'data-advantage="true"' : ''}
            ${roll.disadvantage ? 'data-disadvantage="true"' : ''}
        >
            <i class="fa-solid fa-circle-half-stroke"></i>
            ${label}
            ${roll.difficulty || advantageLabel ? `(${[roll.difficulty, advantageLabel ? game.i18n.localize(`DAGGERHEART.GENERAL.${advantageLabel}.short`) : null].filter(x => x).join(' ')})` : ''}
        </button>
    `;

    return dualityElement;
}

export const renderDualityButton = async event => {
    const button = event.currentTarget,
        traitValue = button.dataset.trait?.toLowerCase(),
        target = getCommandTarget(),
        difficulty = button.dataset.difficulty,
        advantage = button.dataset.advantage ? Number(button.dataset.advantage) : undefined;

    await enrichedDualityRoll(
        {
            traitValue,
            target,
            difficulty,
            title: button.dataset.title,
            label: button.dataset.label,
            actionType: button.dataset.actionType,
            advantage
        },
        event
    );
};

export const enrichedDualityRoll = async (
    { traitValue, target, difficulty, title, label, actionType, advantage },
    event
) => {
    if (!target) return;

    const config = {
        event: event ?? {},
        title: title,
        roll: {
            modifier: traitValue ? target.system.traits[traitValue].value : null,
            label: label,
            difficulty: difficulty,
            advantage,
            type: actionType ?? null // Need check,
        },
        chatMessage: {
            template: 'systems/daggerheart/templates/ui/chat/duality-roll.hbs'
        }
    };
    await target.diceRoll(config);
};
