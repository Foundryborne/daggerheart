import DHBaseActorSheet from '../api/base-actor.mjs';

/**@typedef {import('@client/applications/_types.mjs').ApplicationClickAction} ApplicationClickAction */

export default class DhpEnvironment extends DHBaseActorSheet {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['environment'],
        position: {
            width: 500
        },
        actions: {
            useItem: this.useItem,
            toChat: this.toChat
        },
        dragDrop: [{ dragSelector: '.action-section .inventory-item', dropSelector: null }]
    };

    /**@override */
    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/actors/environment/header.hbs' },
        features: { template: 'systems/daggerheart/templates/sheets/actors/environment/features.hbs' },
        potentialAdversaries: {
            template: 'systems/daggerheart/templates/sheets/actors/environment/potentialAdversaries.hbs'
        },
        notes: { template: 'systems/daggerheart/templates/sheets/actors/environment/notes.hbs' }
    };

    /** @inheritdoc */
    static TABS = {
        primary: {
            tabs: [{ id: 'features' }, { id: 'potentialAdversaries' }, { id: 'notes' }],
            initial: 'features',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    /* -------------------------------------------- */

    getItem(element) {
        const itemId = (element.target ?? element).closest('[data-item-id]').dataset.itemId,
            item = this.document.items.get(itemId);
        return item;
    }

    /* -------------------------------------------- */
    /*  Application Clicks Actions                  */
    /* -------------------------------------------- */

    /**
     *
     * @type {ApplicationClickAction}
     */
    async viewAdversary(_, button) {
        const target = button.closest('[data-item-uuid]');
        const adversary = await foundry.utils.fromUuid(target.dataset.itemUuid);
        if (!adversary) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.adversaryMissing'));
            return;
        }

        adversary.sheet.render({ force: true });
    }

    static async useItem(event, button) {
        const action = this.getItem(event);
        if (!action) {
            await this.viewAdversary(event, button);
        } else {
            action.use(event);
        }
    }

    static async toChat(event) {
        const item = this.getItem(event);
        item.toChat(this.document.id);
    }

    async _onDragStart(event) {
        const item = event.currentTarget.closest('.inventory-item');

        if (item) {
            const adversary = game.actors.find(x => x.type === 'adversary' && x.id === item.dataset.itemId);
            const adversaryData = { type: 'Actor', uuid: adversary.uuid };
            event.dataTransfer.setData('text/plain', JSON.stringify(adversaryData));
            event.dataTransfer.setDragImage(item, 60, 0);
        }
    }
}
