// import DhpApplicationMixin from '../daggerheart-sheet.mjs';

// export default class DomainCardSheet extends DhpApplicationMixin(ItemSheet) {
//     static documentType = "domainCard";

//     /** @override */
//     static get defaultOptions() {
//         return foundry.utils.mergeObject(super.defaultOptions, {
//             classes: ["daggerheart", "sheet", "domain-card"],
//             width: 600,
//             height: 600,
//             tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "features" }]
//         });
//     }

//     /** @override */
//     getData() {
//         const context = super.getData();
//         context.config = CONFIG.daggerheart;

//         return context;
//     }

//     async _handleAction(action, event, button) {
//         switch(action){
//             case 'attributeRoll':

//                 break;
//         }
//     }
// }

import DaggerheartAction from '../../data/action.mjs';
import DaggerheartActionConfig from '../config/Action.mjs';
import DaggerheartSheet from './daggerheart-sheet.mjs';

const { ItemSheetV2 } = foundry.applications.sheets;
export default class DomainCardSheet extends DaggerheartSheet(ItemSheetV2) {
    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'sheet', 'domain-card'],
        position: { width: 600, height: 600 },
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
        form: {
            id: 'feature',
            template: 'systems/daggerheart/templates/sheets/domainCard.hbs'
        }
    };

    _getTabs() {
        const tabs = {
            general: { active: true, cssClass: '', group: 'primary', id: 'general', icon: null, label: 'General' },
            actions: { active: false, cssClass: '', group: 'primary', id: 'actions', icon: null, label: 'Actions' }
        };
        for (const v of Object.values(tabs)) {
            v.active = this.tabGroups[v.group] ? this.tabGroups[v.group] === v.id : v.active;
            v.cssClass = v.active ? 'active' : '';
        }

        return tabs;
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.config = CONFIG.daggerheart;
        context.tabs = this._getTabs();

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
