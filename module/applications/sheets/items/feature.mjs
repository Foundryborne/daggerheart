import DHItemSheetV2 from '../item.mjs';

const { ItemSheetV2 } = foundry.applications.sheets;
export default class FeatureSheet extends DHItemSheetV2(ItemSheetV2) {
    constructor(options = {}) {
        super(options);

        this.selectedEffectType = null;
    }

    static DEFAULT_OPTIONS = {
        id: 'daggerheart-feature',
        classes: ['feature'],
        position: { width: 600, height: 600 },
        window: { resizable: true },
        actions: {
            addEffect: this.addEffect,
            removeEffect: this.removeEffect
        }
    };

    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/items/feature/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        description: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-description.hbs' },
        actions: {
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-actions.hbs',
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

    static TABS = {
        ...super.TABS,
        effects: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'effects',
            icon: null,
            label: 'DAGGERHEART.Sheets.Feature.Tabs.Effects'
        }
    };

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);
        $(htmlElement).find('.effect-select').on('change', this.effectSelect.bind(this));
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.document = this.document;
        context.tabs = super._getTabs(this.constructor.TABS);
        context.generalConfig = SYSTEM.GENERAL;
        context.itemConfig = SYSTEM.ITEM;
        context.properties = SYSTEM.ACTOR.featureProperties;
        context.dice = SYSTEM.GENERAL.diceTypes;
        context.selectedEffectType = this.selectedEffectType;
        context.effectConfig = SYSTEM.EFFECTS;

        return context;
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
}
