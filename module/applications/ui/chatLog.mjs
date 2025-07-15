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

    addChatListeners = async (app, html, data) => {
        super.addChatListeners(app, html, data);

        html.querySelectorAll('.duality-action-damage').forEach(element =>
            element.addEventListener('click', event => this.onRollDamage(event, data.message))
        );
        html.querySelectorAll('.duality-action-healing').forEach(element =>
            element.addEventListener('click', event => this.onRollHealing(event, data.message))
        );
        html.querySelectorAll('.target-save-container').forEach(element =>
            element.addEventListener('click', event => this.onRollSave(event, data.message))
        );
        html.querySelectorAll('.roll-all-save-button').forEach(element =>
            element.addEventListener('click', event => this.onRollAllSave(event, data.message))
        );
        html.querySelectorAll('.duality-action-effect').forEach(element =>
            element.addEventListener('click', event => this.onApplyEffect(event, data.message))
        );
        html.querySelectorAll('.target-container').forEach(element => {
            element.addEventListener('mouseenter', this.hoverTarget);
            element.addEventListener('mouseleave', this.unhoverTarget);
            element.addEventListener('click', this.clickTarget);
        });
        html.querySelectorAll('.button-target-selection').forEach(element => {
            element.addEventListener('click', event => this.onTargetSelection(event, data.message));
        });
        html.querySelectorAll('.damage-button').forEach(element =>
            element.addEventListener('click', event => this.onDamage(event, data.message))
        );
        html.querySelectorAll('.healing-button').forEach(element =>
            element.addEventListener('click', event => this.onHealing(event, data.message))
        );
        html.querySelectorAll('.target-indicator').forEach(element =>
            element.addEventListener('click', this.onToggleTargets)
        );
        html.querySelectorAll('.advantage').forEach(element =>
            element.addEventListener('mouseenter', this.hoverAdvantage)
        );
        html.querySelectorAll('.advantage').forEach(element =>
            element.addEventListener('click', event => this.selectAdvantage.call(this, event, data.message))
        );
        html.querySelectorAll('.ability-use-button').forEach(element =>
            element.addEventListener('click', event => this.abilityUseButton.call(this, event, data.message))
        );
        html.querySelectorAll('.action-use-button').forEach(element =>
            element.addEventListener('click', event => this.actionUseButton.call(this, event, data.message))
        );
    };

    setupHooks() {
        Hooks.on('renderChatMessageHTML', this.addChatListeners.bind());
    }

    close(options) {
        Hooks.off('renderChatMessageHTML', this.addChatListeners);
        super.close(options);
    }

    async getActor(id) {
        // return game.actors.get(id);
        return await fromUuid(id);
    }

    getAction(actor, itemId, actionId) {
        const item = actor.items.get(itemId),
            action =
                actor.system.attack?._id === actionId
                    ? actor.system.attack
                    : item.system.attack?._id === actionId
                      ? item.system.attack
                      : item?.system?.actions?.find(a => a._id === actionId);
        return action;
    }

    onRollDamage = async (event, message) => {
        event.stopPropagation();
        const actor = await this.getActor(message.system.source.actor);
        if (!actor || !game.user.isGM) return true;
        if (message.system.source.item && message.system.source.action) {
            const action = this.getAction(actor, message.system.source.item, message.system.source.action);
            if (!action || !action?.rollDamage) return;
            await action.rollDamage(event, message);
        }
    };

    onRollHealing = async (event, message) => {
        event.stopPropagation();
        const actor = await this.getActor(message.system.source.actor);
        if (!actor || !game.user.isGM) return true;
        if (message.system.source.item && message.system.source.action) {
            const action = this.getAction(actor, message.system.source.item, message.system.source.action);
            if (!action || !action?.rollHealing) return;
            await action.rollHealing(event, message);
        }
    };

    onRollSave = async (event, message) => {
        event.stopPropagation();
        const actor = await this.getActor(message.system.source.actor),
            tokenId = event.target.closest('[data-token]')?.dataset.token,
            token = game.canvas.tokens.get(tokenId);
        if (!token?.actor || !token.isOwner) return true;
        if (message.system.source.item && message.system.source.action) {
            const action = this.getAction(actor, message.system.source.item, message.system.source.action);
            if (!action || !action?.hasSave) return;
            action.rollSave(token, event, message);
        }
    };

    onRollAllSave = async (event, message) => {
        event.stopPropagation();
        const targets = event.target.parentElement.querySelectorAll(
            '.target-section > [data-token] .target-save-container'
        );
        targets.forEach(el => {
            el.dispatchEvent(new PointerEvent('click', { shiftKey: true }));
        });
    };

    onApplyEffect = async (event, message) => {
        event.stopPropagation();
        const actor = await this.getActor(message.system.source.actor);
        if (!actor || !game.user.isGM) return true;
        if (message.system.source.item && message.system.source.action) {
            const action = this.getAction(actor, message.system.source.item, message.system.source.action);
            if (!action || !action?.applyEffects) return;
            const { isHit, targets } = this.getTargetList(event, message);
            if (targets.length === 0)
                ui.notifications.info(game.i18n.localize('DAGGERHEART.UI.Notifications.noTargetsSelected'));
            await action.applyEffects(event, message, targets);
        }
    };

    onTargetSelection = async (event, message) => {
        event.stopPropagation();
        const targetSelection = Boolean(event.target.dataset.targetHit),
            msg = ui.chat.collection.get(message._id);
        if (msg.system.targetSelection === targetSelection) return;
        if (targetSelection !== true && !Array.from(game.user.targets).length)
            return ui.notifications.info(game.i18n.localize('DAGGERHEART.UI.Notifications.noTargetsSelected'));
        msg.system.targetSelection = targetSelection;
        msg.system.prepareDerivedData();
        ui.chat.updateMessage(msg);
    };

    getTargetList = (event, message) => {
        const targetSelection = event.target
                .closest('.message-content')
                .querySelector('.button-target-selection.target-selected'),
            isHit = Boolean(targetSelection?.dataset?.targetHit) ?? false;
        return {
            isHit,
            targets: isHit
                ? message.system.targets.filter(t => t.hit === true).map(target => game.canvas.tokens.get(target.id))
                : Array.from(game.user.targets)
        };
    };

    hoverTarget = event => {
        event.stopPropagation();
        const token = canvas.tokens.get(event.currentTarget.dataset.token);
        if (!token?.controlled) token._onHoverIn(event, { hoverOutOthers: true });
    };

    unhoverTarget = event => {
        const token = canvas.tokens.get(event.currentTarget.dataset.token);
        if (!token?.controlled) token._onHoverOut(event);
    };

    clickTarget = event => {
        event.stopPropagation();
        const token = canvas.tokens.get(event.currentTarget.dataset.token);
        if (!token) {
            ui.notifications.info(game.i18n.localize('DAGGERHEART.UI.Notifications.attackTargetDoesNotExist'));
            return;
        }

        game.canvas.pan(token);
    };

    onDamage = async (event, message) => {
        event.stopPropagation();
        const { isHit, targets } = this.getTargetList(event, message);

        if (message.system.onSave && isHit) {
            const pendingingSaves = message.system.targets.filter(
                target => target.hit && target.saved.success === null
            );
            if (pendingingSaves.length) {
                const confirm = await foundry.applications.api.DialogV2.confirm({
                    window: { title: 'Pending Reaction Rolls found' },
                    content: `<p>Some Tokens still need to roll their Reaction Roll.</p><p>Are you sure you want to continue ?</p><p><i>Undone reaction rolls will be considered as failed</i></p>`
                });
                if (!confirm) return;
            }
        }

        if (targets.length === 0)
            ui.notifications.info(game.i18n.localize('DAGGERHEART.UI.Notifications.noTargetsSelected'));
        for (let target of targets) {
            let damage = message.system.roll.total;
            if (message.system.onSave && message.system.targets.find(t => t.id === target.id)?.saved?.success === true)
                damage = Math.ceil(damage * (CONFIG.DH.ACTIONS.damageOnSave[message.system.onSave]?.mod ?? 1));

            target.actor.takeDamage(damage, message.system.damage.damageType);
        }
    };

    onHealing = async (event, message) => {
        event.stopPropagation();
        const targets = Array.from(game.user.targets);

        if (targets.length === 0)
            ui.notifications.info(game.i18n.localize('DAGGERHEART.UI.Notifications.noTargetsSelected'));

        for (var target of targets) {
            target.actor.takeHealing([{ value: message.system.roll.total, type: message.system.roll.type }]);
        }
    };

    /**
     * Toggle visibility of target containers.
     * @param {MouseEvent} event
     */
    onToggleTargets(event) {
        event.stopPropagation();
        event.currentTarget.parentElement
            ?.querySelectorAll('.target-container')
            .forEach(el => el.classList.toggle('hidden'));
    }

    /**
     * Highlight advantage icons on hover.
     * @param {MouseEvent} event
     */
    hoverAdvantage(event) {
        const parent = event.currentTarget.parentElement;
        if (!parent) return;

        parent.querySelectorAll('.advantage').forEach(el => {
            if (el !== event.currentTarget) {
                el.classList.toggle('unused');
            }
        });
    }

    /**
     * Handle selecting an advantage and disable further selection.
     * @param {MouseEvent} event
     * @param {object} message
     */
    async selectAdvantage(event, message) {
        event.stopPropagation();

        const updateMessage = game.messages.get(message._id);
        await updateMessage?.update({
            system: { advantageSelected: event.currentTarget.id === 'hope' ? 1 : 2 }
        });

        const parent = event.currentTarget.parentElement;
        if (!parent) return;

        parent.querySelectorAll('.advantage').forEach(el => {
            el.replaceWith(el.cloneNode(true));
        });
    }

    abilityUseButton = async (event, message) => {
        event.stopPropagation();

        const action = message.system.actions[Number.parseInt(event.currentTarget.dataset.index)];
        const actor = game.actors.get(message.system.source.actor);
        await actor.useAction(action);
    };

    actionUseButton = async (_, message) => {
        const parent = await foundry.utils.fromUuid(message.system.actor);
        const actionType = Object.values(message.system.moves)[0].actions[0];
        const cls = CONFIG.DH.ACTIONS.actionTypes[actionType.type];
        const action = new cls(
            { ...actionType, _id: foundry.utils.randomID(), name: game.i18n.localize(actionType.name) },
            { parent: parent }
        );

        action.use();
    };
}
