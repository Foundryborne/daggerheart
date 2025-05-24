import { abilities } from '../config/actorConfig.mjs';

export async function dualityRollEnricher(match, _options) {
    try {
        const {
            hope = 'd12',
            fear = 'd12',
            attribute,
            advantage,
            disadvantage
        } = JSON.parse(`{${match[1].replace(' ', ',').replace(/(\w+(?==))(=)/g, '"$1":')}}`);
        const dualityElement = document.createElement('span');

        const attributeLabel =
            attribute && abilities[attribute]
                ? game.i18n.format('DAGGERHEART.General.Check', {
                      check: game.i18n.localize(abilities[attribute].label)
                  })
                : null;
        const label = attributeLabel ?? game.i18n.localize('DAGGERHEART.General.Duality');
        dualityElement.innerHTML = `
            <button class="duality-roll-button" 
                data-hope="${hope}" 
                data-fear="${fear}" 
                ${attribute ? `data-attribute="${attribute}"` : ''}
                ${advantage ? 'data-advantage="true"' : ''}
                ${disadvantage ? 'data-disadvantage="true"' : ''}
            >
                <i class="fa-solid fa-circle-half-stroke"></i>
                ${label}
            </button>
        `;

        return dualityElement;
    } catch (_) {
        return match[0];
    }
}
