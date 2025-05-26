import { abilities } from '../config/actorConfig.mjs';
import { rollCommandToJSON } from '../helpers/utils.mjs';

export function dualityRollEnricher(match, _options) {
    const roll = rollCommandToJSON(match[1]);
    if (!roll) return match[0];

    return getDualityMessage(roll);
}

export function getDualityMessage(roll) {
    const attributeLabel =
        roll.attribute && abilities[roll.attribute]
            ? game.i18n.format('DAGGERHEART.General.Check', {
                  check: game.i18n.localize(abilities[roll.attribute].label)
              })
            : null;
    const label = attributeLabel ?? game.i18n.localize('DAGGERHEART.General.Duality');

    const dualityElement = document.createElement('span');
    dualityElement.innerHTML = `
        <button class="duality-roll-button" 
            data-label="${label}"
            data-hope="${roll.hope ?? 'd12'}" 
            data-fear="${roll.fear ?? 'd12'}" 
            ${roll.attribute && abilities[roll.attribute] ? `data-attribute="${roll.attribute}"` : ''}
            ${roll.advantage ? 'data-advantage="true"' : ''}
            ${roll.disadvantage ? 'data-disadvantage="true"' : ''}
        >
            <i class="fa-solid fa-circle-half-stroke"></i>
            ${label}
        </button>
    `;

    return dualityElement;
}
