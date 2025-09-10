import { abilities } from '../config/actorConfig.mjs';
import { getCommandTarget, rollCommandToJSON } from '../helpers/utils.mjs';

export default function DhDualityRollEnricher(match, _options) {
    const roll = rollCommandToJSON(match[1], match[0]);
    if (!roll) return match[0];

    return getDualityMessage(roll.result, roll.flavor);
}

function getDualityMessage(roll, flavor) {
    const trait = roll?.trait && abilities[roll.trait] ? game.i18n.localize(abilities[roll.trait].label) : null;
    const label =
        flavor ??
        (roll?.trait
            ? game.i18n.format('DAGGERHEART.GENERAL.rollWith', { roll: trait })
            : roll?.reaction
              ? game.i18n.localize('DAGGERHEART.GENERAL.reactionRoll')
              : game.i18n.localize('DAGGERHEART.GENERAL.duality'));

    const dataLabel = trait
        ? game.i18n.localize(abilities[roll.trait].label)
        : game.i18n.localize('DAGGERHEART.GENERAL.duality');

    const advantage = roll?.advantage
        ? CONFIG.DH.ACTIONS.advantageState.advantage.value
        : roll?.disadvantage
          ? CONFIG.DH.ACTIONS.advantageState.disadvantage.value
          : undefined;
    const advantageLabel =
        advantage === CONFIG.DH.ACTIONS.advantageState.advantage.value
            ? 'Advantage'
            : advantage === CONFIG.DH.ACTIONS.advantageState.disadvantage.value
              ? 'Disadvantage'
              : undefined;

    const dualityElement = document.createElement('span');
    dualityElement.innerHTML = `
        <button type="button" class="duality-roll-button${roll?.inline ? ' inline' : ''}" 
            data-title="${label}"
            data-label="${dataLabel}"
            data-reaction="${roll?.reaction ? 'true' : 'false'}"
            data-hope="${roll?.hope ?? 'd12'}" 
            data-fear="${roll?.fear ?? 'd12'}"
            ${advantage ? `data-advantage="${advantage}"` : ''}
            ${roll?.difficulty !== undefined ? `data-difficulty="${roll.difficulty}"` : ''}
            ${roll?.trait && abilities[roll.trait] ? `data-trait="${roll.trait}"` : ''}
            ${roll?.advantage ? 'data-advantage="true"' : ''}
            ${roll?.disadvantage ? 'data-disadvantage="true"' : ''}
        >
            ${roll?.reaction ? '<i class="fa-solid fa-reply"></i>' : '<i class="fa-solid fa-circle-half-stroke"></i>'}
            ${label}
            ${!flavor && (roll?.difficulty || advantageLabel) ? `(${[roll.difficulty, advantageLabel ? game.i18n.localize(`DAGGERHEART.GENERAL.${advantageLabel}.short`) : null].filter(x => x).join(' ')})` : ''}
        </button>
    `;

    return dualityElement;
}

export const renderDualityButton = async event => {
    const button = event.currentTarget,
        reaction = button.dataset.reaction === 'true',
        traitValue = button.dataset.trait?.toLowerCase(),
        target = getCommandTarget({ allowNull: true }),
        difficulty = button.dataset.difficulty,
        advantage = button.dataset.advantage ? Number(button.dataset.advantage) : undefined;

    await enrichedDualityRoll(
        {
            reaction,
            traitValue,
            target,
            difficulty,
            title: button.dataset.title,
            label: button.dataset.label,
            advantage
        },
        event
    );
};

export const enrichedDualityRoll = async (
    { reaction, traitValue, target, difficulty, title, label, advantage },
    event
) => {
    const config = {
        event: event ?? {},
        title: title,
        roll: {
            trait: traitValue && target ? traitValue : null,
            label: label,
            difficulty: difficulty,
            advantage,
            type: reaction ? 'reaction' : null
        },
        type: 'trait',
        hasRoll: true
    };

    if (target) {
        await target.diceRoll(config);
    } else {
        // For no target, call DualityRoll directly with basic data
        config.data = { experiences: {}, traits: {} };
        config.source = { actor: null };
        await CONFIG.Dice.daggerheart.DualityRoll.build(config);
    }
};
