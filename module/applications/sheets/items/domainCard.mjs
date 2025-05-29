import DaggerheartAction from '../../../data/action.mjs';
import DaggerheartActionConfig from '../../config/Action.mjs';
import DaggerheartSheet from '../daggerheart-sheet.mjs';

const { ItemSheetV2 } = foundry.applications.sheets;
export default class DomainCardSheet extends DaggerheartSheet(ItemSheetV2) {
    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'sheet', 'item', 'dh-style', 'domain-card'],
        position: { width: 450, height: 700 },
        actions: {
            addAction: this.addAction,
            editAction: this.editAction,
            removeAction: this.removeAction
        },
        form: {
            handler: this.updateForm,
            submitOnChange: true,
            closeOnSubmit: false
        }
    };

    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/items/domainCard/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        description: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-description.hbs' },
        actions: {
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-actions.hbs',
            scrollable: ['.actions']
        },
        settings: {
            template: 'systems/daggerheart/templates/sheets/items/domainCard/settings.hbs',
            scrollable: ['.settings']
        }
    };

    static TABS = {
        description: {
            active: true,
            cssClass: '',
            group: 'primary',
            id: 'description',
            icon: null,
            label: 'DAGGERHEART.Sheets.Feature.Tabs.Description'
        },
        actions: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'actions',
            icon: null,
            label: 'DAGGERHEART.Sheets.Feature.Tabs.Actions'
        },
        settings: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'settings',
            icon: null,
            label: 'DAGGERHEART.Sheets.Feature.Tabs.Settings'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.config = CONFIG.daggerheart;
        context.tabs = super._getTabs(this.constructor.TABS);

        return context;
    }

    static async updateForm(event, _, formData) {
        await this.document.update(formData.object);
        this.render();
    }

    static async addAction() {
        const actionIndexes = this.document.system.actions.map(x => x.id.split('-')[2]).sort((a, b) => a - b);
        const action = await new DaggerheartAction(
            {
                id: `${this.document.id}-Action-${actionIndexes.length > 0 ? actionIndexes[0] + 1 : 1}`
            },
            {
                parent: this.document
            }
        );
        await this.document.update({ 'system.actions': [...this.document.system.actions, action] });
        await new DaggerheartActionConfig(this.document.system.actions[this.document.system.actions.length - 1]).render(
            true
        );
    }

    static async editAction(_, button) {
        const action = this.document.system.actions[button.dataset.index];
        await new DaggerheartActionConfig(action).render(true);
    }

    static async removeAction(event, button) {
        event.stopPropagation();
        await this.document.update({
            'system.actions': this.document.system.actions.filter(
                (_, index) => index !== Number.parseInt(button.dataset.index)
            )
        });
    }
}
