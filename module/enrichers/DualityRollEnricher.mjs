import { abilities } from '../config/actorConfig.mjs';
import { getCommandTarget, rollCommandToJSON } from '../helpers/utils.mjs';

export default function DhDualityRollEnricher(match, _options) {
    const roll = rollCommandToJSON(match[1]);
    if (!roll) return match[0];

    return getDualityMessage(roll);
}

export function getDualityMessage(roll) {
    const traitLabel =
        roll.trait && abilities[roll.trait]
            ? game.i18n.format('DAGGERHEART.General.Check', {
                  check: game.i18n.localize(abilities[roll.trait].label)
              })
            : null;

    const label = traitLabel ?? game.i18n.localize('DAGGERHEART.General.Duality');
    const dataLabel = traitLabel
        ? game.i18n.localize(abilities[roll.trait].label)
        : game.i18n.localize('DAGGERHEART.General.Duality');

    const dualityElement = document.createElement('span');
    dualityElement.innerHTML = `
        <button class="duality-roll-button" 
            data-title="${label}"
            data-label="${dataLabel}"
            data-hope="${roll.hope ?? 'd12'}" 
            data-fear="${roll.fear ?? 'd12'}" 
            ${roll.trait && abilities[roll.trait] ? `data-trait="${roll.trait}"` : ''}
            ${roll.advantage ? 'data-advantage="true"' : ''}
            ${roll.disadvantage ? 'data-disadvantage="true"' : ''}
        >
            <i class="fa-solid fa-circle-half-stroke"></i>
            ${label}
        </button>
    `;

    return dualityElement;
}

export const renderDualityButton = async event => {
    const button = event.currentTarget,
        traitValue = button.dataset.trait?.toLowerCase(),
        target = getCommandTarget();
    if (!target) return;

    const config = {
        event: event,
        title: button.dataset.title,
        roll: {
            modifier: traitValue ? target.system.traits[traitValue].value : null,
            label: button.dataset.label,
            type: button.dataset.actionType ?? null // Need check
        },
        chatMessage: {
            template: 'systems/daggerheart/templates/chat/duality-roll.hbs'
        }
    };
    await target.diceRoll(config);
};
