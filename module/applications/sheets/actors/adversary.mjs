import DHBaseActorSheet from '../api/base-actor.mjs';

/**@typedef {import('@client/applications/_types.mjs').ApplicationClickAction} ApplicationClickAction */

export default class AdversarySheet extends DHBaseActorSheet {
    static DEFAULT_OPTIONS = {
        classes: ['adversary'],
        position: { width: 660, height: 766 },
        window: { resizable: true },
        actions: {
            reactionRoll: AdversarySheet.#reactionRoll,
            useItem: this.useItem,
            useAction: this.useItem,
            toChat: this.toChat
        },
        window: {
            resizable: true
        }
    };

    static PARTS = {
        sidebar: { template: 'systems/daggerheart/templates/sheets/actors/adversary/sidebar.hbs' },
        header: { template: 'systems/daggerheart/templates/sheets/actors/adversary/header.hbs' },
        features: { template: 'systems/daggerheart/templates/sheets/actors/adversary/features.hbs' },
        notes: { template: 'systems/daggerheart/templates/sheets/actors/adversary/notes.hbs' },
        effects: { template: 'systems/daggerheart/templates/sheets/actors/adversary/effects.hbs' }
    };

    /** @inheritdoc */
    static TABS = {
        primary: {
            tabs: [{ id: 'features' }, { id: 'notes' }, { id: 'effects' }],
            initial: 'features',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    /**@inheritdoc */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.systemFields.attack.fields = this.document.system.attack.schema.fields;
        return context;
    }

    getItem(element) {
        const itemId = (element.target ?? element).closest('[data-item-id]').dataset.itemId,
            item = this.document.items.get(itemId);
        return item;
    }

    /* -------------------------------------------- */
    /*  Application Clicks Actions                  */
    /* -------------------------------------------- */

    /**
     * Performs a reaction roll for an Adversary.
     * @type {ApplicationClickAction}
     */
    static #reactionRoll(event) {
        const config = {
            event: event,
            title: `Reaction Roll: ${this.actor.name}`,
            headerTitle: 'Adversary Reaction Roll',
            roll: {
                type: 'reaction'
            },
            chatMessage: {
                type: 'adversaryRoll',
                template: 'systems/daggerheart/templates/ui/chat/adversary-roll.hbs',
                mute: true
            }
        };

        this.actor.diceRoll(config);
    }

    /**
     *
     * @type {ApplicationClickAction}
     */
    static async useItem(event) {
        const action = this.getItem(event) ?? this.actor.system.attack;
        action.use(event);
    }

    /**
     *
     * @type {ApplicationClickAction}
     */
    static async toChat(event, button) {
        if (button?.dataset?.type === 'experience') {
            const experience = this.document.system.experiences[button.dataset.uuid];
            const cls = getDocumentClass('ChatMessage');
            const systemData = {
                name: game.i18n.localize('DAGGERHEART.GENERAL.Experience.single'),
                description: `${experience.name} ${experience.total.signedString()}`
            };
            const msg = new cls({
                type: 'abilityUse',
                user: game.user.id,
                system: systemData,
                content: await foundry.applications.handlebars.renderTemplate(
                    'systems/daggerheart/templates/ui/chat/ability-use.hbs',
                    systemData
                )
            });

            cls.create(msg.toObject());
        } else {
            const item = this.getItem(event) ?? this.document.system.attack;
            item.toChat(this.document.id);
        }
    }
}
