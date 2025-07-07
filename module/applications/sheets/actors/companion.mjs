import DHBaseActorSheet from '../api/base-actor.mjs';

/**@typedef {import('@client/applications/_types.mjs').ApplicationClickAction} ApplicationClickAction */

export default class DhCompanionSheet extends DHBaseActorSheet {
    static DEFAULT_OPTIONS = {
        classes: ['actor', 'companion'],
        position: { width: 300 },
        actions: {
            viewActor: this.viewActor,
            useItem: this.useItem,
            toChat: this.toChat
        }
    };

    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/actors/companion/header.hbs' },
        details: { template: 'systems/daggerheart/templates/sheets/actors/companion/details.hbs' },
        effects: { template: 'systems/daggerheart/templates/sheets/actors/companion/effects.hbs' }
    };

    /* -------------------------------------------- */

    /** @inheritdoc */
    static TABS = {
        primary: {
            tabs: [{ id: 'details' }, { id: 'effects' }],
            initial: 'details',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    /* -------------------------------------------- */
    /*  Application Clicks Actions                  */
    /* -------------------------------------------- */

    static async viewActor(_, button) {
        const target = button.closest('[data-item-uuid]');
        const actor = await foundry.utils.fromUuid(target.dataset.itemUuid);
        if (!actor) return;

        actor.sheet.render(true);
    }

    getAction(element) {
        const itemId = (element.target ?? element).closest('[data-item-id]').dataset.itemId,
            item = this.document.system.actions.find(x => x.id === itemId);
        return item;
    }

    static async useItem(event) {
        const action = this.getAction(event) ?? this.actor.system.attack;
        action.use(event);
    }

    static async toChat(event, button) {
        if (button?.dataset?.type === 'experience') {
            const experience = this.document.system.experiences[button.dataset.uuid];
            const cls = getDocumentClass('ChatMessage');
            const systemData = {
                name: game.i18n.localize('DAGGERHEART.GENERAL.Experience.single'),
                description: `${experience.name} ${experience.total < 0 ? experience.total : `+${experience.total}`}`
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
            const item = this.getAction(event) ?? this.document.system.attack;
            item.toChat(this.document.id);
        }
    }
}
