import { emitAsGM, GMUpdateEvent } from '../../systemRegistration/socket.mjs';

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

    addChatListeners = async (app, html, data) => {
        html.querySelectorAll('.duality-action-damage').forEach(element =>
            element.addEventListener('click', event => this.onRollDamage(event, data.message))
        );
        html.querySelectorAll('.target-save').forEach(element =>
            element.addEventListener('click', event => this.onRollSave(event, data.message))
        );
        html.querySelectorAll('.roll-all-save-button').forEach(element =>
            element.addEventListener('click', event => this.onRollAllSave(event, data.message))
        );
        html.querySelectorAll('.simple-roll-button').forEach(element =>
            element.addEventListener('click', event => this.onRollSimple(event, data.message))
        );
        html.querySelectorAll('.healing-button').forEach(element =>
            element.addEventListener('click', event => this.onHealing(event, data.message))
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
    };

    setupHooks() {
        Hooks.on('renderChatMessageHTML', this.addChatListeners.bind());
    }

    close(options) {
        Hooks.off('renderChatMessageHTML', this.addChatListeners);
        super.close(options);
    }

    async getActor(uuid) {
        return await foundry.utils.fromUuid(uuid);
    }

    getAction(actor, itemId, actionId) {
        const item = actor.items.get(itemId),
            action =
                actor.system.attack?._id === actionId
                    ? actor.system.attack
                    : item.system.attack?._id === actionId
                      ? item.system.attack
                      : item?.system?.actions?.get(actionId);
        return action;
    }

    async onRollDamage(event, message) {
        event.stopPropagation();
        const actor = await this.getActor(message.system.source.actor);
        if (game.user.character?.id !== actor.id && !game.user.isGM) return true;
        if (message.system.source.item && message.system.source.action) {
            const action = this.getAction(actor, message.system.source.item, message.system.source.action);
            if (!action || !action?.rollDamage) return;
            await action.rollDamage(event, message);
        }
    }

    async onRollSave(event, message) {
        event.stopPropagation();
        const actor = await this.getActor(message.system.source.actor),
            tokenId = event.target.closest('[data-token]')?.dataset.token,
            token = game.canvas.tokens.get(tokenId);
        if (!token?.actor || !token.isOwner) return true;
        if (message.system.source.item && message.system.source.action) {
            const action = this.getAction(actor, message.system.source.item, message.system.source.action);
            if (!action || !action?.hasSave) return;
            action.rollSave(token.actor, event, message).then(result =>
                emitAsGM(
                    GMUpdateEvent.UpdateSaveMessage,
                    action.updateSaveMessage.bind(action, result, message, token.id),
                    {
                        action: action.uuid,
                        message: message._id,
                        token: token.id,
                        result
                    }
                )
            );
        }
    }

    async onRollAllSave(event, message) {
        event.stopPropagation();
        if (!game.user.isGM) return;
        const targets = event.target.parentElement.querySelectorAll('[data-token] .target-save');
        const actor = await this.getActor(message.system.source.actor),
            action = this.getAction(actor, message.system.source.item, message.system.source.action);
        targets.forEach(async el => {
            const tokenId = el.closest('[data-token]')?.dataset.token,
                token = game.canvas.tokens.get(tokenId);
            if (!token.actor) return;
            if (game.user === token.actor.owner) el.dispatchEvent(new PointerEvent('click', { shiftKey: true }));
            else {
                token.actor.owner
                    .query('reactionRoll', {
                        actionId: action.uuid,
                        actorId: token.actor.uuid,
                        event,
                        message
                    })
                    .then(result => action.updateSaveMessage(result, message, token.id));
            }
        });
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
        if (event.currentTarget.dataset.directDamage) action.use(event, { byPassRoll: true });
        else action.use(event);
    }

    async actionUseButton(event, message) {
        const { moveIndex, actionIndex } = event.currentTarget.dataset;
        const parent = await foundry.utils.fromUuid(message.system.actor);
        const actionType = message.system.moves[moveIndex].actions[actionIndex];
        const cls = game.system.api.models.actions.actionsTypes[actionType.type];
        const action = new cls(
            { ...actionType, _id: foundry.utils.randomID(), name: game.i18n.localize(actionType.name) },
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
        let originalRoll_parsed = message.rolls.map(roll => JSON.parse(roll))[0];
        const rollClass =
            game.system.api.dice[
                message.type === 'dualityRoll' ? 'DualityRoll' : target.dataset.type === 'damage' ? 'DHRoll' : 'D20Roll'
            ];

        if (!game.modules.get('dice-so-nice')?.active) foundry.audio.AudioHelper.play({ src: CONFIG.sounds.dice });

        const { newRoll, parsedRoll } = await rollClass.reroll(originalRoll_parsed, target, message);

        await game.messages.get(message._id).update({
            'system.roll': newRoll,
            'rolls': [parsedRoll]
        });
    }
}
