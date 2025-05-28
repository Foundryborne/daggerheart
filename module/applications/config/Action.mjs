import DaggerheartSheet from '../sheets/daggerheart-sheet.mjs';

const { ApplicationV2 } = foundry.applications.api;
export default class DaggerheartActionConfig extends DaggerheartSheet(ApplicationV2) {
    constructor(action) {
        super({});

        this.action = action;
        this.openSection = null;
    }

    // get title(){
    //     return `Action - ${this.action.name}`;
    // }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        id: 'daggerheart-action',
        classes: ['daggerheart', 'views', 'action'],
        position: { width: 600, height: 'auto' },
        actions: {
            toggleSection: this.toggleSection
        },
        form: {
            handler: this.updateForm,
            closeOnSubmit: true
        }
    };

    static PARTS = {
        form: {
            id: 'action',
            template: 'systems/daggerheart/templates/views/action.hbs'
        }
    };

    _getTabs() {
        const tabs = {
            effects: { active: true, cssClass: '', group: 'primary', id: 'effects', icon: null, label: 'Effects' },
            useage: { active: false, cssClass: '', group: 'primary', id: 'useage', icon: null, label: 'Useage' },
            conditions: {
                active: false,
                cssClass: '',
                group: 'primary',
                id: 'conditions',
                icon: null,
                label: 'Conditions'
            }
        };

        for (const v of Object.values(tabs)) {
            v.active = this.tabGroups[v.group] ? this.tabGroups[v.group] === v.id : v.active;
            v.cssClass = v.active ? 'active' : '';
        }

        return tabs;
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options, 'action');
        context.openSection = this.openSection;
        context.tabs = this._getTabs();

        return context;
    }

    static toggleSection(_, button) {
        this.openSection = button.dataset.section === this.openSection ? null : button.dataset.section;
        this.render(true);
    }

    static async updateForm(event, _, formData) {
        const data = foundry.utils.expandObject(
            foundry.utils.mergeObject(this.action.toObject(), foundry.utils.expandObject(formData.object))
        );
        const newActions = this.action.parent.actions.map(x => x.toObject());
        if (!newActions.findSplice(x => x.id === data.id, data)) {
            newActions.push(data);
        }

        await this.action.parent.parent.update({ 'system.actions': newActions });
    }
}
