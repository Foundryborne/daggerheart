const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

/**
 * @import DhAppearance from '../../data/settings/Appearance.mjs';
 * @import {ApplicationClickAction} from "@client/applications/_types.mjs"
 */

/** Settings menu for appearance settings */
export default class DHAppearanceSettings extends HandlebarsApplicationMixin(ApplicationV2) {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        tag: 'form',
        id: 'daggerheart-appearance-settings',
        classes: ['daggerheart', 'dialog', 'dh-style', 'setting', 'appearance-settings'],
        position: { width: '600', height: 'auto' },
        window: {
            title: 'DAGGERHEART.SETTINGS.Menu.title',
            icon: 'fa-solid fa-gears'
        },
        actions: {
            reset: DHAppearanceSettings.#onReset
        },
        form: {
            closeOnSubmit: true,
            handler: DHAppearanceSettings.#onSubmit
        }
    };

    static PARTS = {
        header: { template: 'systems/daggerheart/templates/settings/appearance-settings/header.hbs' },
        main: { template: 'systems/daggerheart/templates/settings/appearance-settings/main.hbs' },
        footer: { template: 'templates/generic/form-footer.hbs' }
    };

    /**@type {DhAppearance}*/
    setting;

    static #localized = false;

    /** @inheritDoc */
    async _preFirstRender(_context, _options) {
        await super._preFirstRender(_context, _options);
        if (!DHAppearanceSettings.#localized) {
            foundry.helpers.Localization.localizeDataModel(this.setting.constructor);
            DHAppearanceSettings.#localized = true;
        }
    }

    /**@inheritdoc */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        if (options.isFirstRender) {
            this.setting = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.appearance);
        }

        context.setting = this.setting;
        context.fields = this.setting.schema.fields;
        context.isGM = game.user.isGM;

        return context;
    }

    /**@inheritdoc */
    async _preparePartContext(partId, context, options) {
        const partContext = await super._preparePartContext(partId, context, options);
        switch (partId) {
            case 'footer':
                partContext.buttons = [
                    {
                        type: 'button',
                        action: 'reset',
                        icon: 'fa-solid fa-arrow-rotate-left',
                        label: game.i18n.localize('SETTINGS.UI.ACTIONS.Reset')
                    },
                    { type: 'submit', icon: 'fa-solid fa-floppy-disk', label: game.i18n.localize('EDITOR.Save') }
                ];
                break;
        }
        return partContext;
    }

    /**
     * Submit the configuration form.
     * @this {DHAppearanceSettings}
     * @param {SubmitEvent} event
     * @param {HTMLFormElement} form
     * @param {foundry.applications.ux.FormDataExtended} formData
     * @returns {Promise<void>}
     */
    static async #onSubmit(_event, _form, formData) {
        const data = this.setting.schema.clean(foundry.utils.expandObject(formData.object));

        await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.appearance, data);
    }

    /* -------------------------------------------- */

    /**
     * Reset the form back to default values.
     * @this {DHAppearanceSettings}
     * @type {ApplicationClickAction}
     */
    static async #onReset() {
        this.setting = new this.setting.constructor();
        this.render({ force: false });
    }
}
