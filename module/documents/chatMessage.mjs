export default class DhChatMessage extends foundry.documents.ChatMessage {
    static #EXPAND_SECTIONS = [
        { selector: '.roll-section [data-action="expandRoll"]', key: 'roll' },
        { selector: '.damage-section', key: 'damage' },
        { selector: '.description-section', key: 'desc' }
    ];

    constructor(data, options) {
        super(data, options);

        this.setupHooks();
    }

    setupHooks() {
        if (this.system.hasTarget) {
            this.controlTokenHook = Hooks.on('controlToken', this.onSelectToken.bind(this));
        }
    }

    async onSelectToken() {
        this.system.syncSelectedTokens();
    }

    async renderHTML() {
        const actor = game.actors.get(this.speaker.actor);
        const actorData =
            actor && this.isContentVisible
                ? actor
                : {
                    img: this.author.avatar ? this.author.avatar : 'icons/svg/mystery-man.svg',
                    name: ''
                };
        /* We can change to fully implementing the renderHTML function if needed, instead of augmenting it. */
        const html = await super.renderHTML({ actor: actorData, author: this.author });

        if (this.flags.core?.RollTable || this.flags.daggerheart?.noButtons) {
            html.querySelector('.roll-buttons.apply-buttons')?.remove();
        }

        this.enrichChatMessage(html);
        this.addChatListeners(html);
        
        // todo: move to system renderHTML once implemented
        if (['adversaryRoll', 'damageRoll', 'dualityRoll', 'fateRoll'].includes(this.type)) {
            html.classList.add('themed', 'theme-dark');
        }

        return html;
    }

    /* -------------------------------------------- */

    /** @inheritDoc */
    _onUpdate(changes, options, userId) {
        super._onUpdate(changes, options, userId);

        const lastMessage = Array.from(game.messages).sort((a, b) => b.timestamp - a.timestamp)[0];
        if (lastMessage.id === this.id && ui.chat.isAtBottom) {
            setTimeout(() => {
                ui.chat.scrollBottom();
            }, 5);
        }
    }

    _onDelete(options, userId) {
        super._onDelete(options, userId);

        if (this.controlTokenHook) {
            Hooks.off('controlToken', this.controlTokenHook);
        }
    }

    enrichChatMessage(html) {
        const elements = html.querySelectorAll('[data-perm-id]');
        elements.forEach(e => {
            const uuid = e.dataset.permId,
                document = fromUuidSync(uuid);
            if (!document) return;

            e.setAttribute('data-use-perm', document.testUserPermission(game.user, 'OWNER'));

            const settings = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Metagaming);
            if (settings.hideObserverPermissionInChat)
                e.setAttribute('data-view-perm', document.testUserPermission(game.user, 'OBSERVER'));
        });

        if (this.isContentVisible) {
            if (this.type === 'dualityRoll') {
                html.classList.add('duality');
                if (this.system.roll.withHope) html.classList.add('hope');
                else if (this.system.roll.withFear) html.classList.add('fear');
                else html.classList.add('critical');
            }
            if (this.type === 'fateRoll') {
                html.classList.add('fate');
                if (this.system.roll?.fateDie) {
                    html.classList.add(this.system.roll.fateDie.toLowerCase());
                }
            }

            // Check registered selectors and the main item section for expanding
            // Preserving during re-render is handled by core foundry on anything with [data-action=expandRoll]
            const autoExpandRoll = game.settings.get(
                CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.appearance
            ).expandRollMessage;
            for (const { selector, key } of DhChatMessage.#EXPAND_SECTIONS) {
                const elements = html.querySelectorAll(selector);
                for (const element of elements) {
                    element.classList.toggle('expanded', autoExpandRoll[key]);
                }
            }

            // Auto expand the item description. These are not preserved by foundry during re-renders
            const itemDesc = html.querySelector('details');
            if (itemDesc) {
                const existing = document.querySelector(`.chat-message[data-message-id="${this.id}"] details`);
                if (existing?.hasAttribute('open') ?? autoExpandRoll.desc) {
                    itemDesc.setAttribute('open', '');
                }
            }
        }

        if (!this.isAuthor && !this.speakerActor?.isOwner) {
            const applyButtons = html.querySelector('.apply-buttons');
            applyButtons?.remove();
            const buttons = html.querySelectorAll('.ability-card-footer > .ability-use-button');
            buttons.forEach(b => b.remove());
        }
    }

    addChatListeners(html) {
        this.system.addChatListeners?.(html);
    }

    // Some old v13 messages don't have system data and will cause errors here during roll construction otherwise. TODO. See if message.roll.options.effects can be saved/instantiated as actual ActiveEffects, then this can be removed.
    static migrateData(source) {
        for (let i = 0; i < (source.rolls ?? []).length; i++) {
            const rollData = source.rolls[i];
            const roll = typeof rollData === 'string' ? Roll.fromJSON(rollData) : rollData;
            for (const effect of (roll.options.effects ?? [])) {
                if (!effect.system.changes) {
                    effect.system.changes = effect.changes ?? [];
                    if (effect.changes) delete effect.changes;
                    source.rolls.splice(i, 1, JSON.stringify(roll.toJSON()));
                }
            }
        }
        return source;
    }
}
