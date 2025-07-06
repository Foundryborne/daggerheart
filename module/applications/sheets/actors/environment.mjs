import DaggerheartSheet from '../daggerheart-sheet.mjs';
import DHEnvironmentSettings from '../../sheets-configs/environment-settings.mjs';

const { ActorSheetV2 } = foundry.applications.sheets;
export default class DhpEnvironment extends DaggerheartSheet(ActorSheetV2) {
    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'sheet', 'actor', 'dh-style', 'environment'],
        position: {
            width: 500
        },
        actions: {
            addAdversary: this.addAdversary,
            deleteProperty: this.deleteProperty,
            openSettings: this.openSettings,
            useItem: this.useItem,
            toChat: this.toChat
        },
        form: {
            handler: this._updateForm,
            submitOnChange: true,
            closeOnSubmit: false
        },
        dragDrop: [{ dragSelector: '.action-section .inventory-item', dropSelector: null }]
    };

    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/actors/environment/header.hbs' },
        features: { template: 'systems/daggerheart/templates/sheets/actors/environment/features.hbs' },
        potentialAdversaries: {
            template: 'systems/daggerheart/templates/sheets/actors/environment/potentialAdversaries.hbs'
        },
        notes: { template: 'systems/daggerheart/templates/sheets/actors/environment/notes.hbs' }
    };

    static TABS = {
        features: {
            active: true,
            cssClass: '',
            group: 'primary',
            id: 'features',
            icon: null,
            label: 'DAGGERHEART.GENERAL.Tabs.features'
        },
        potentialAdversaries: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'potentialAdversaries',
            icon: null,
            label: 'DAGGERHEART.GENERAL.Tabs.potentialAdversaries'
        },
        notes: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'notes',
            icon: null,
            label: 'DAGGERHEART.GENERAL.Tabs.notes'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.document = this.document;
        context.tabs = super._getTabs(this.constructor.TABS);
        context.getEffectDetails = this.getEffectDetails.bind(this);

        return context;
    }

    getItem(element) {
        const itemId = (element.target ?? element).closest('[data-item-id]').dataset.itemId,
            item = this.document.items.get(itemId);
        return item;
    }

    static async openSettings() {
        await new DHEnvironmentSettings(this.document).render(true);
    }

    static async _updateForm(event, _, formData) {
        await this.document.update(formData.object);
        this.render();
    }

    getEffectDetails(id) {
        return {};
    }

    static async addAdversary() {
        await this.document.update({
            [`system.potentialAdversaries.${foundry.utils.randomID()}.label`]: game.i18n.localize(
                'DAGGERHEART.ACTORS.Environment.newAdversary'
            )
        });
        this.render();
    }

    static async deleteProperty(_, target) {
        await this.document.update({ [`${target.dataset.path}.-=${target.id}`]: null });
        this.render();
    }

    async viewAdversary(_, button) {
        const target = button.closest('[data-item-uuid]');
        const adversary = await foundry.utils.fromUuid(target.dataset.itemUuid);
        if (!adversary) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.adversaryMissing'));
            return;
        }

        adversary.sheet.render(true);
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
