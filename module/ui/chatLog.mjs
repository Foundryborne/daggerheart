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
        html.querySelectorAll('.duality-action').forEach(element =>
            element.addEventListener('click', event => this.onRollDamage(event, data.message))
        );
        html.querySelectorAll('.target-container').forEach(element => {
            element.addEventListener('mouseenter', this.hoverTarget);
            element.addEventListener('mouseleave', this.unhoverTarget);
            element.addEventListener('click', this.clickTarget);
        });
        html.querySelectorAll('.damage-button').forEach(element =>
            element.addEventListener('click', event => this.onDamage(event, data.message))
        );
        html.querySelectorAll('.healing-button').forEach(element => element.addEventListener('click', this.onHealing));
        html.querySelectorAll('.target-indicator').forEach(element =>
            element.addEventListener('click', this.onToggleTargets)
        );
        html.querySelectorAll('.advantage').forEach(element =>
            element.addEventListener('mouseenter', this.hoverAdvantage)
        );
        html.querySelectorAll('.advantage').forEach(element =>
            element.addEventListener('click', event => this.selectAdvantage.bind(this)(event, data.message))
        );
        html.querySelectorAll('.ability-use-button').forEach(element =>
            element.addEventListener('click', event => this.abilityUseButton.bind(this)(event, data.message))
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
        const actor = game.actors.get(message.system.origin);
        if (!actor || !game.user.isGM) return true;

        await actor.damageRoll(
            message.system.title,
            message.system.damage,
            message.system.targets.filter(x => x.hit).map(x => ({ id: x.id, name: x.name, img: x.img })),
            event.shiftKey
        );
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
            ui.notifications.info(game.i18n.localize('DAGGERHEART.Notification.Info.AttackTargetDoesNotExist'));
            return;
        }

        game.canvas.pan(token);
    };

    onDamage = async (event, message) => {
        event.stopPropagation();
        const targets = event.currentTarget.dataset.targetHit
            ? message.system.targets.map(target => game.canvas.tokens.get(target.id))
            : Array.from(game.user.targets);

        if (targets.length === 0)
            ui.notifications.info(game.i18n.localize('DAGGERHEART.Notification.Info.NoTargetsSelected'));

        for (var target of targets) {
            await target.actor.takeDamage(message.system.damage.total, message.system.damage.type);
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
        const actor = game.actors.get(message.system.origin);
        await actor.useAction(action);
    };
}
