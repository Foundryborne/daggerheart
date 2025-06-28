import DHBaseItemSheet from '../api/base-item.mjs';

export default class FeatureSheet extends DHBaseItemSheet {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        id: 'daggerheart-feature',
        classes: ['feature'],
        position: { height: 600 },
        window: { resizable: true },
        actions: {
            addEffect: this.addEffect,
            removeEffect: this.removeEffect
        }
    };

    /**@override */
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

    /**
     * Internally tracks the selected effect type from the select.
     * @type {String}
     * @private
     */
    _selectedEffectType;

    /**@override */
    static TABS = {
        primary: {
            tabs: [{ id: 'description' }, { id: 'actions' }, { id: 'settings' }, { id: 'effects' }],
            initial: 'description',
            labelPrefix: 'DAGGERHEART.Sheets.TABS'
        }
    };

    /* -------------------------------------------- */

    /**@inheritdoc*/
    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);
        if (partId === 'effects')
            htmlElement.querySelector('.effect-select')?.addEventListener('change', this._effectSelect.bind(this));
    }

    /**
     * Handles selection of a new effect type.
     * @param {Event} event - Change Event
     */
    _effectSelect(event) {
        const value = event.currentTarget.value;
        this._selectedEffectType = value;
        this.render({ parts: ['effects'] });
    }

    /* -------------------------------------------- */

    /**@inheritdoc */
    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.properties = CONFIG.daggerheart.ACTOR.featureProperties;
        context.dice = CONFIG.daggerheart.GENERAL.diceTypes;
        context.effectConfig = CONFIG.daggerheart.EFFECTS;

        context.selectedEffectType = this._selectedEffectType;

        return context;
    }

    /* -------------------------------------------- */
    /*  Application Clicks Actions                  */
    /* -------------------------------------------- */

    /**
     * Adds a new effect to the item, based on the selected effect type.
     * @param {PointerEvent} _event - The originating click event
     * @param {HTMLElement} _target - The capturing HTML element which defines the [data-action]
     * @returns
     */
    static async addEffect(_event, _target) {
        const type = this._selectedEffectType;
        if (!type) return;
        const { id, name, ...rest } = CONFIG.daggerheart.EFFECTS.effectTypes[type];
        await this.item.update({
            [`system.effects.${foundry.utils.randomID()}`]: {
                type,
                value: '',
                ...rest
            }
        });
    }

    /**
     * Removes an effect from the item.
     * @param {PointerEvent} _event - The originating click event
     * @param {HTMLElement} target - The capturing HTML element which defines the [data-action]
     * @returns
     */
    static async removeEffect(_event, target) {
        const path = `system.effects.-=${target.dataset.effect}`;
        await this.item.update({ [path]: null });
    }
}
