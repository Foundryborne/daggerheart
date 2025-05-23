export default class DhpChatLog extends foundry.applications.sidebar.tabs.ChatLog {
    constructor() {
        super();

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
        html.querySelectorAll('.roll-damage-button').forEach(element =>
            element.addEventListener('click', event => this.onRollDamage(event, data.message))
        );
        html.querySelectorAll('.target-container').forEach(element =>
            element.addEventListener('hover', hover(this.hoverTarget, this.unhoverTarget))
        ); // ????
        // html.find('.target-container').mouseout(this.unhoverTarget);
        html.querySelectorAll('.damage-button').forEach(element => element.addEventListener('click', this.onDamage));
        html.querySelectorAll('.healing-button').forEach(element => element.addEventListener('click', this.onHealing));
        html.querySelectorAll('.target-indicator').forEach(element =>
            element.addEventListener('click', this.onToggleTargets)
        );
        html.querySelectorAll('.advantage').forEach(element => element.hover(this.hoverAdvantage)); // ??
        html.querySelectorAll('.advantage').forEach(element =>
            element.addEventListener('click', event => this.selectAdvantage.bind(this)(event, data.message))
        );
        html.querySelectorAll('.ability-use-button').forEach(element =>
            element.addEventListener('click', this.abilityUseButton.bind(this)(event, data.message))
        );
    };

    setupHooks() {
        Hooks.on('renderChatMessageHTML', this.addChatListeners.bind());
    }

    close(options) {
        Hooks.off('renderChatMessageHTML', this.addChatListeners);
        super.close(options);
    }

    onRollDamage = async (event, message) => {
        event.stopPropagation();

        await game.user.character.damageRoll(message.system.damage, event.shiftKey);
    };

    hoverTarget = event => {
        event.stopPropagation();
        const token = canvas.tokens.get(event.currentTarget.dataset.token);
        if (!token.controlled) token._onHoverIn(event, { hoverOutOthers: true });
    };

    unhoverTarget = event => {
        const token = canvas.tokens.get(event.currentTarget.dataset.token);
        if (!token.controlled) token._onHoverOut(event);
    };

    onDamage = async event => {
        event.stopPropagation();
        const damage = Number.parseInt(event.currentTarget.dataset.value);
        const targets = Array.from(game.user.targets);

        if (targets.length === 0)
            ui.notifications.info(game.i18n.localize('DAGGERHEART.Notification.Info.NoTargetsSelected'));

        for (var target of targets) {
            await target.actor.takeDamage(damage, event.currentTarget.dataset.type);
        }
    };

    onHealing = async event => {
        event.stopPropagation();
        const healing = Number.parseInt(event.currentTarget.dataset.value);
        const targets = Array.from(game.user.targets);

        if (targets.length === 0)
            ui.notifications.info(game.i18n.localize('DAGGERHEART.Notification.Info.NoTargetsSelected'));

        for (var target of targets) {
            await target.actor.takeHealing(healing, event.currentTarget.dataset.type);
        }
    };

    onToggleTargets = async event => {
        event.stopPropagation();
        $($(event.currentTarget).parent()).find('.target-container').toggleClass('hidden');
    };

    hoverAdvantage = event => {
        $(event.currentTarget).siblings('.advantage').toggleClass('unused');
    };

    selectAdvantage = async (event, message) => {
        event.stopPropagation();

        const updateMessage = game.messages.get(message._id);
        await updateMessage.update({ system: { advantageSelected: event.currentTarget.id === 'hope' ? 1 : 2 } });

        $(event.currentTarget).siblings('.advantage').off('click');
        $(event.currentTarget).off('click');
    };

    abilityUseButton = async (event, message) => {
        event.stopPropagation();

        const action = message.system.actions[Number.parseInt(event.currentTarget.dataset.index)];
        await game.user.character.useAction(action);
    };
}
