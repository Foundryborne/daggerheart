import { abilities } from '../../config/actorConfig.mjs';
import { emitAsGM, GMUpdateEvent, RefreshType, socketEvent } from '../../systemRegistration/socket.mjs';

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

    addChatListeners = async (app, html, data) => {
        html.querySelectorAll('.simple-roll-button').forEach(element =>
            element.addEventListener('click', event => this.onRollSimple(event, data.message))
        );
        html.querySelectorAll('.ability-use-button').forEach(element =>
            element.addEventListener('click', event => this.abilityUseButton(event, data.message))
        );
        html.querySelectorAll('.action-use-button').forEach(element =>
            element.addEventListener('click', event => this.actionUseButton(event, data.message))
        );
        html.querySelectorAll('.reroll-button').forEach(element =>
            element.addEventListener('click', event => this.rerollEvent(event, data.message))
        );
        html.querySelectorAll('.group-roll-button').forEach(element =>
            element.addEventListener('click', event => this.groupRollButton(event, data.message))
        );
        html.querySelectorAll('.group-roll-reroll').forEach(element =>
            element.addEventListener('click', event => this.groupRollReroll(event, data.message))
        );
        html.querySelectorAll('.group-roll-success').forEach(element =>
            element.addEventListener('click', event => this.groupRollSuccessEvent(event, data.message))
        );
        html.querySelectorAll('.group-roll-header-expand-section').forEach(element =>
            element.addEventListener('click', this.groupRollExpandSection)
        );
    };

    setupHooks() {
        Hooks.on('renderChatMessageHTML', this.addChatListeners.bind());
    }

    close(options) {
        Hooks.off('renderChatMessageHTML', this.addChatListeners);
        super.close(options);
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
        const parent = await foundry.utils.fromUuid(message.system.actor);
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
                }
            },
            { parent: parent.system }
        );

        action.use(event);
    }

    async rerollEvent(event, message) {
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

        const target = event.target.closest('[data-die-index]');

        if (target.dataset.type === 'damage') {
            game.system.api.dice.DamageRoll.reroll(target, message);
        } else {
            let originalRoll_parsed = message.rolls.map(roll => JSON.parse(roll))[0];
            const rollClass =
                game.system.api.dice[
                    message.type === 'dualityRoll'
                        ? 'DualityRoll'
                        : target.dataset.type === 'damage'
                          ? 'DHRoll'
                          : 'D20Roll'
                ];

            if (!game.modules.get('dice-so-nice')?.active) foundry.audio.AudioHelper.play({ src: CONFIG.sounds.dice });

            const { newRoll, parsedRoll } = await rollClass.reroll(originalRoll_parsed, target, message);

            await game.messages.get(message._id).update({
                'system.roll': newRoll,
                'rolls': [parsedRoll]
            });

            Hooks.callAll(socketEvent.Refresh, { refreshType: RefreshType.TagTeamRoll });
            await game.socket.emit(`system.${CONFIG.DH.id}`, {
                action: socketEvent.Refresh,
                data: {
                    refreshType: RefreshType.TagTeamRoll
                }
            });
        }
    }

    async groupRollButton(event, message) {
        const path = event.currentTarget.dataset.path;
        const isLeader = path === 'leader';
        const { actor: actorData, trait } = foundry.utils.getProperty(message.system, path);
        const actor = game.actors.get(actorData._id);

        if (!actor) {
            return ui.notifications.error(
                game.i18n.format('DAGGERHEART.UI.Notifications.documentIsMissing', {
                    documentType: game.i18n.localize('TYPES.Actor.character')
                })
            );
        }

        if (!actor.testUserPermission(game.user, 'OWNER')) {
            return ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.noActorOwnership'));
        }

        const traitLabel = game.i18n.localize(abilities[trait].label);
        const config = {
            event: event,
            title: `${game.i18n.localize('DAGGERHEART.GENERAL.dualityRoll')}: ${actor.name}`,
            headerTitle: game.i18n.format('DAGGERHEART.UI.Chat.dualityRoll.abilityCheckTitle', {
                ability: traitLabel
            }),
            roll: {
                trait: trait,
                advantage: 0,
                modifiers: [{ label: traitLabel, value: actor.system.traits[trait].value }]
            },
            hasRoll: true,
            skips: {
                createMessage: true,
                resources: !isLeader
            }
        };
        const result = await actor.diceRoll({
            ...config,
            headerTitle: `${game.i18n.localize('DAGGERHEART.GENERAL.dualityRoll')}: ${actor.name}`,
            title: game.i18n.format('DAGGERHEART.UI.Chat.dualityRoll.abilityCheckTitle', {
                ability: traitLabel
            })
        });

        if (!result) return;
        await game.system.api.fields.ActionFields.CostField.execute.call({ actor }, result);

        const newMessageData = foundry.utils.deepClone(message.system);
        foundry.utils.setProperty(newMessageData, `${path}.result`, result.roll);
        const renderData = { system: new game.system.api.models.chatMessages.config.groupRoll(newMessageData) };

        const updatedContent = await foundry.applications.handlebars.renderTemplate(
            'systems/daggerheart/templates/ui/chat/groupRoll.hbs',
            { ...renderData, user: game.user }
        );
        const mess = game.messages.get(message._id);

        await emitAsGM(
            GMUpdateEvent.UpdateDocument,
            mess.update.bind(mess),
            {
                ...renderData,
                content: updatedContent
            },
            mess.uuid
        );
    }

    async groupRollReroll(event, message) {
        const path = event.currentTarget.dataset.path;
        const { actor: actorData, trait } = foundry.utils.getProperty(message.system, path);
        const actor = game.actors.get(actorData._id);

        if (!actor.testUserPermission(game.user, 'OWNER')) {
            return ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.noActorOwnership'));
        }

        const traitLabel = game.i18n.localize(abilities[trait].label);

        const config = {
            event: event,
            title: `${game.i18n.localize('DAGGERHEART.GENERAL.dualityRoll')}: ${actor.name}`,
            headerTitle: game.i18n.format('DAGGERHEART.UI.Chat.dualityRoll.abilityCheckTitle', {
                ability: traitLabel
            }),
            roll: {
                trait: trait,
                advantage: 0,
                modifiers: [{ label: traitLabel, value: actor.system.traits[trait].value }]
            },
            hasRoll: true,
            skips: {
                createMessage: true
            }
        };
        const result = await actor.diceRoll({
            ...config,
            headerTitle: `${game.i18n.localize('DAGGERHEART.GENERAL.dualityRoll')}: ${actor.name}`,
            title: game.i18n.format('DAGGERHEART.UI.Chat.dualityRoll.abilityCheckTitle', {
                ability: traitLabel
            })
        });

        const newMessageData = foundry.utils.deepClone(message.system);
        foundry.utils.setProperty(newMessageData, `${path}.result`, { ...result.roll, rerolled: true });
        const renderData = { system: new game.system.api.models.chatMessages.config.groupRoll(newMessageData) };

        const updatedContent = await foundry.applications.handlebars.renderTemplate(
            'systems/daggerheart/templates/ui/chat/groupRoll.hbs',
            { ...renderData, user: game.user }
        );
        const mess = game.messages.get(message._id);
        await emitAsGM(
            GMUpdateEvent.UpdateDocument,
            mess.update.bind(mess),
            {
                ...renderData,
                content: updatedContent
            },
            mess.uuid
        );
    }

    async groupRollSuccessEvent(event, message) {
        if (!game.user.isGM) {
            return ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.gmOnly'));
        }

        const { path, success } = event.currentTarget.dataset;
        const { actor: actorData } = foundry.utils.getProperty(message.system, path);
        const actor = game.actors.get(actorData._id);

        if (!actor.testUserPermission(game.user, 'OWNER')) {
            return ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.noActorOwnership'));
        }

        const newMessageData = foundry.utils.deepClone(message.system);
        foundry.utils.setProperty(newMessageData, `${path}.manualSuccess`, Boolean(success));
        const renderData = { system: new game.system.api.models.chatMessages.config.groupRoll(newMessageData) };

        const updatedContent = await foundry.applications.handlebars.renderTemplate(
            'systems/daggerheart/templates/ui/chat/groupRoll.hbs',
            { ...renderData, user: game.user }
        );
        const mess = game.messages.get(message._id);
        await emitAsGM(
            GMUpdateEvent.UpdateDocument,
            mess.update.bind(mess),
            {
                ...renderData,
                content: updatedContent
            },
            mess.uuid
        );
    }

    async groupRollExpandSection(event) {
        event.target
            .closest('.group-roll-header-expand-section')
            .querySelectorAll('i')
            .forEach(element => {
                element.classList.toggle('fa-angle-up');
                element.classList.toggle('fa-angle-down');
            });
        event.target.closest('.group-roll-section').querySelector('.group-roll-content').classList.toggle('closed');
    }
}
