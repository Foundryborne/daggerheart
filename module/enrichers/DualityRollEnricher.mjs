import { abilities } from '../config/actorConfig.mjs';
import { createHtmlElement, getCommandTarget, rollCommandToJSON } from '../helpers/utils.mjs';

export function DhDualityRollEnricher(match, _options) {
    const roll = rollCommandToJSON(match[0]);
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
    const anchor = createHtmlElement('a', {
        className: 'content-link duality-roll-button',
        data: {
            title: label,
            label: dataLabel,
            reaction: `${roll?.reaction ? 'true' : 'false'}`,
            hope: roll?.hope ?? 'd12',
            fear: roll?.fear ?? 'd12',
            difficulty: roll?.difficulty,
            trait: roll?.trait && abilities[roll.trait] ? roll.trait : null,
            advantage: roll?.advantage || null,
            disadvantage: roll?.disadvantage || null,
            grantResources: roll?.grantResources || null
        },
        html: [
            roll?.reaction ? '<i class="fa-solid fa-reply"></i>' : '<i class="fa-solid fa-circle-half-stroke"></i>',
            label,
            !flavor && (roll?.difficulty || advantageLabel) ? `(${[roll.difficulty, advantageLabel ? game.i18n.localize(`DAGGERHEART.GENERAL.${advantageLabel}.short`) : null].filter(x => x).join(' ')})` : ''
        ].join('')
    });
    dualityElement.append(anchor);
    return dualityElement;
}

export const renderDualityButton = async event => {
    const button = event.target,
        reaction = button.dataset.reaction === 'true',
        traitValue = button.dataset.trait?.toLowerCase(),
        target = getCommandTarget({ allowNull: true }),
        difficulty = button.dataset.difficulty,
        advantage = button.dataset.advantage ? Number(button.dataset.advantage) : undefined,
        grantResources = Boolean(button.dataset?.grantResources);

    await enrichedDualityRoll(
        {
            reaction,
            traitValue,
            target,
            difficulty,
            title: button.dataset.title,
            label: button.dataset.label,
            advantage,
            grantResources
        },
        event
    );
};

export const enrichedDualityRoll = async (
    { reaction, traitValue, target, difficulty, title, label, advantage, grantResources, customConfig },
    event
) => {
    const shouldGrantResources = grantResources === undefined ? true : grantResources;

    const config = {
        event: event ?? {},
        title: title,
        headerTitle: label,
        actionType: reaction ? 'reaction' : null,
        roll: {
            trait: traitValue && target ? traitValue : null,
            difficulty: difficulty,
            advantage
            // type: reaction ? 'reaction' : null //not needed really but keeping it for troubleshooting
        },
        skips: {
            resources: !shouldGrantResources,
            triggers: !shouldGrantResources
        },
        type: 'trait',
        hasRoll: true,
        ...(customConfig ?? {})
    };

    if (target) {
        const result = await target.diceRoll(config);
        if (!result) return;
        result.resourceUpdates.updateResources();
    } else {
        // For no target, call DualityRoll directly with basic data
        config.data = { experiences: {}, traits: {}, rules: {} };
        config.source = { actor: null };
        await CONFIG.Dice.daggerheart.DualityRoll.build(config);
    }
    return config;
};
