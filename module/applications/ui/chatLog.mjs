import { enrichedDualityRoll } from '../../enrichers/DualityRollEnricher.mjs';
import { enrichedFateRoll, getFateTypeData } from '../../enrichers/FateRollEnricher.mjs';
import { getCommandTarget, rollCommandToJSON } from '../../helpers/utils.mjs';

export default class DhpChatLog extends foundry.applications.sidebar.tabs.ChatLog {
    constructor(options) {
        super(options);

        this.targetTemplate = {
            activeLayer: undefined,
            document: undefined,
            object: undefined,
            minimizedSheets: [],
            config: undefined,
            targets: undefined
        };
        this.setupHooks();
    }

    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        classes: ['daggerheart']
    };

    static CHAT_COMMANDS = {
        ...super.CHAT_COMMANDS,
        dr: {
            rgx: /^(?:\/dr)((?:\s)[^]*)?/,
            fn: (_, match) => {
                const argString = match[1]?.trim();
                const result = argString ? rollCommandToJSON(argString) : { result: {} };
                if (!result) {
                    ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.dualityParsing'));
                    return false;
                }

                const { result: rollCommand, flavor } = result;

                const reaction = rollCommand.reaction;
                const traitValue = rollCommand.trait?.toLowerCase();
                const advantage = rollCommand.advantage
                    ? CONFIG.DH.ACTIONS.advantageState.advantage.value
                    : rollCommand.disadvantage
                      ? CONFIG.DH.ACTIONS.advantageState.disadvantage.value
                      : undefined;
                const difficulty = rollCommand.difficulty;
                const grantResources = rollCommand.grantResources;

                const target = getCommandTarget({ allowNull: true });
                const title =
                    (flavor ?? traitValue)
                        ? game.i18n.format('DAGGERHEART.UI.Chat.dualityRoll.abilityCheckTitle', {
                              ability: game.i18n.localize(SYSTEM.ACTOR.abilities[traitValue].label)
                          })
                        : game.i18n.localize('DAGGERHEART.GENERAL.duality');

                enrichedDualityRoll({
                    reaction,
                    traitValue,
                    target,
                    difficulty,
                    title,
                    label: game.i18n.localize('DAGGERHEART.GENERAL.dualityRoll'),
                    actionType: null,
                    advantage,
                    grantResources
                });
                return false;
            }
        },
        fr: {
            rgx: /^(?:\/fr)((?:\s)[^]*)?/,
            fn: (_, match) => {
                const argString = match[1]?.trim();
                const result = argString ? rollCommandToJSON(argString) : { result: {} };

                if (!result) {
                    ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.fateParsing'));
                    return false;
                }

                const { result: rollCommand, flavor } = result;
                const fateTypeData = getFateTypeData(rollCommand?.type);

                if (!fateTypeData)
                    return ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.fateTypeParsing'));

                const { value: fateType, label: fateTypeLabel } = fateTypeData;
                const target = getCommandTarget({ allowNull: true });
                const title = flavor ?? game.i18n.localize('DAGGERHEART.GENERAL.fateRoll');

                enrichedFateRoll({
                    target,
                    title,
                    label: fateTypeLabel,
                    fateType
                });
                return false;
            }
        }
    };

    _getEntryContextOptions() {
        return [
            ...super._getEntryContextOptions(),
            // {
            //     name: 'Reroll',
            //     icon: '<i class="fa-solid fa-dice"></i>',
            //     condition: li => {
            //         const message = game.messages.get(li.dataset.messageId);

            //         return (game.user.isGM || message.isAuthor) && message.rolls.length > 0;
            //     },
            //     callback: li => {
            //         const message = game.messages.get(li.dataset.messageId);
            //         new game.system.api.applications.dialogs.RerollDialog(message).render({ force: true });
            //     }
            // },
            {
                name: game.i18n.localize('DAGGERHEART.UI.ChatLog.rerollDamage'),
                icon: '<i class="fa-solid fa-dice"></i>',
                condition: li => {
                    const message = game.messages.get(li.dataset.messageId);
                    const hasRolledDamage = message.system.hasDamage
                        ? Object.keys(message.system.damage).length > 0
                        : false;
                    return (game.user.isGM || message.isAuthor) && hasRolledDamage;
                },
                callback: li => {
                    const message = game.messages.get(li.dataset.messageId);
                    new game.system.api.applications.dialogs.RerollDamageDialog(message).render({ force: true });
                }
            }
        ];
    }

    addChatListeners = async (document, html, data) => {
        const message = data?.message ?? document.toObject(false);
        html.querySelectorAll('.simple-roll-button').forEach(element =>
            element.addEventListener('click', event => this.onRollSimple(event, message))
        );
        html.querySelectorAll('.ability-use-button').forEach(element =>
            element.addEventListener('click', event => this.abilityUseButton(event, message))
        );
        html.querySelectorAll('.action-use-button').forEach(element =>
            element.addEventListener('click', event => this.actionUseButton(event, message))
        );
        html.querySelectorAll('.reroll-button').forEach(element =>
            element.addEventListener('click', event => this.rerollEvent(event, message))
        );
        html.querySelectorAll('.risk-it-all-button').forEach(element =>
            element.addEventListener('click', event => this.riskItAllClearStressAndHitPoints(event, data))
        );
    };

    setupHooks() {
        Hooks.on('renderChatMessageHTML', this.addChatListeners.bind());
    }

    close(options) {
        Hooks.off('renderChatMessageHTML', this.addChatListeners);
        super.close(options);
    }

    /** Ensure the chat theme inherits the interface theme */
    _replaceHTML(result, content, options) {
        const themedElement = result.log?.querySelector('.chat-log');
        themedElement?.classList.remove('themed', 'theme-light', 'theme-dark');
        super._replaceHTML(result, content, options);
    }

    /** Remove chat log theme from notifications area */
    async _onFirstRender(result, content) {
        await super._onFirstRender(result, content);
        document
            .querySelector('#chat-notifications .chat-log')
            ?.classList.remove('themed', 'theme-light', 'theme-dark');
    }

    async onRollSimple(event, message) {
        const buttonType = event.target.dataset.type ?? 'damage',
            total = message.rolls.reduce((a, c) => a + Roll.fromJSON(c).total, 0),
            damages = {
                hitPoints: {
                    parts: [
                        {
                            applyTo: 'hitPoints',
                            damageTypes: [],
                            total
                        }
                    ]
                }
            },
            targets = Array.from(game.user.targets);

        if (targets.length === 0)
            return ui.notifications.info(game.i18n.localize('DAGGERHEART.UI.Notifications.noTargetsSelected'));

        targets.forEach(target => {
            if (buttonType === 'healing') target.actor.takeHealing(damages);
            else target.actor.takeDamage(damages);
        });
    }

    async abilityUseButton(event, message) {
        event.stopPropagation();

        const item = await foundry.utils.fromUuid(message.system.origin);
        const action =
            item.system.attack?.id === event.currentTarget.id
                ? item.system.attack
                : item.system.actions.get(event.currentTarget.id);
        if (event.currentTarget.dataset.directDamage) {
            const config = action.prepareConfig(event);
            config.hasRoll = false;
            action.workflow.get('damage').execute(config, null, true);
        } else action.use(event);
    }

    async actionUseButton(event, message) {
        const { moveIndex, actionIndex, movePath } = event.currentTarget.dataset;
        const targetUuid = event.currentTarget.closest('.action-use-button-parent').querySelector('select')?.value;
        const parent = await foundry.utils.fromUuid(targetUuid || message.system.actor);

        const actionType = message.system.moves[moveIndex].actions[actionIndex];
        const cls = game.system.api.models.actions.actionsTypes[actionType.type];
        const action = new cls(
            {
                ...actionType,
                _id: foundry.utils.randomID(),
                name: game.i18n.localize(actionType.name),
                originItem: {
                    type: CONFIG.DH.ITEM.originItemType.restMove,
                    itemPath: movePath,
                    actionIndex: actionIndex
                },
                targetUuid: targetUuid
            },
            { parent: parent.system }
        );

        action.use(event);
    }

    async rerollEvent(event, messageData) {
        event.stopPropagation();
        if (!event.shiftKey) {
            const confirmed = await foundry.applications.api.DialogV2.confirm({
                window: {
                    title: game.i18n.localize('DAGGERHEART.UI.Chat.reroll.confirmTitle')
                },
                content: game.i18n.localize('DAGGERHEART.UI.Chat.reroll.confirmText')
            });
            if (!confirmed) return;
        }

        const message = game.messages.get(messageData._id);
        const target = event.target.closest('[data-die-index]');

        if (target.dataset.type === 'damage') {
            const { damageType, part, dice, result } = target.dataset;
            const damagePart = message.system.damage[damageType].parts[part];
            const { parsedRoll, rerolledDice } = await game.system.api.dice.DamageRoll.reroll(damagePart, dice, result);
            const damageParts = message.system.damage[damageType].parts.map((damagePart, index) => {
                if (index !== Number(part)) return damagePart;
                return {
                    ...damagePart,
                    total: parsedRoll.total,
                    dice: rerolledDice
                };
            });
            const updateMessage = game.messages.get(message._id);
            await updateMessage.update({
                [`system.damage.${damageType}`]: {
                    total: parsedRoll.total,
                    parts: damageParts
                }
            });
        } else {
            const rerollDice = message.system.roll.dice[target.dataset.dieIndex];
            await rerollDice.reroll(`/r1=${rerollDice.total}`, {
                liveRoll: {
                    roll: message.system.roll,
                    actor: message.system.actionActor,
                    isReaction: message.system.roll.options.actionType === 'reaction'
                }
            });
            await message.update({
                rolls: [message.system.roll.toJSON()]
            });
        }
    }

    async riskItAllClearStressAndHitPoints(event, data) {
        const resourceValue = event.target.dataset.resourceValue;
        const actor = game.actors.get(event.target.dataset.actorId);
        new game.system.api.applications.dialogs.RiskItAllDialog(actor, resourceValue).render({ force: true });
    }
}
