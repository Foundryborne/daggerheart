import DaggerheartAction from '../../data/action.mjs';
import DaggerheartActionConfig from '../config/Action.mjs';
import DaggerheartSheet from './daggerheart-sheet.mjs';

const { ItemSheetV2 } = foundry.applications.sheets;
export default class FeatureSheet extends DaggerheartSheet(ItemSheetV2) {
    constructor(options = {}) {
        super(options);

        this.selectedEffectType = null;
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        id: 'daggerheart-feature',
        classes: ['daggerheart', 'sheet', 'dh-style', 'feature'],
        position: { width: 600, height: 600 },
        window: { resizable: true },
        actions: {
            addEffect: this.addEffect,
            removeEffect: this.removeEffect,
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
        header: { template: 'systems/daggerheart/templates/sheets/items/feature/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        description: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-description.hbs' },
        actions: {
            template: 'systems/daggerheart/templates/sheets/items/feature/actions.hbs',
            scrollable: ['.actions']
        },
        settings: {
            template: 'systems/daggerheart/templates/sheets/items/feature/settings.hbs',
            scrollable: ['.settings']
        },
        effects: {
            template: 'systems/daggerheart/templates/sheets/items/feature/effects.hbs',
            scrollable: ['.effects']
        }
    };

    _getTabs() {
        const tabs = {
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
            },
            effects: {
                active: false,
                cssClass: '',
                group: 'primary',
                id: 'effects',
                icon: null,
                label: 'DAGGERHEART.Sheets.Feature.Tabs.Effects'
            }
        };
        for (const v of Object.values(tabs)) {
            v.active = this.tabGroups[v.group] ? this.tabGroups[v.group] === v.id : v.active;
            v.cssClass = v.active ? 'active' : '';
        }

        return tabs;
    }

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);
        $(htmlElement).find('.effect-select').on('change', this.effectSelect.bind(this));
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.document = this.document;
        context.tabs = this._getTabs();
        context.generalConfig = SYSTEM.GENERAL;
        context.itemConfig = SYSTEM.ITEM;
        context.properties = SYSTEM.ACTOR.featureProperties;
        context.dice = SYSTEM.GENERAL.diceTypes;
        context.selectedEffectType = this.selectedEffectType;
        context.effectConfig = SYSTEM.EFFECTS;

        return context;
    }

    static async updateForm(event, _, formData) {
        await this.document.update(formData.object);
        this.render();
    }

    effectSelect(event) {
        this.selectedEffectType = event.currentTarget.value;
        this.render(true);
    }

    static async addEffect() {
        if (!this.selectedEffectType) return;

        const { id, name, ...rest } = SYSTEM.EFFECTS.effectTypes[this.selectedEffectType];
        const update = {
            [foundry.utils.randomID()]: {
                type: this.selectedEffectType,
                value: '',
                ...rest
            }
        };
        await this.item.update({ 'system.effects': update });
    }

    static async removeEffect(_, button) {
        const path = `system.effects.-=${button.dataset.effect}`;
        await this.item.update({ [path]: null });
    }

    static async addAction() {
        const action = await new DaggerheartAction({ img: this.document.img }, { parent: this.document });
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
