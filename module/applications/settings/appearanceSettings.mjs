import DhAppearance from '../../data/settings/Appearance.mjs';
import { getDiceSoNicePreset } from '../../config/generalConfig.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

/**
 * @import {ApplicationClickAction} from "@client/applications/_types.mjs"
 */

export default class DHAppearanceSettings extends HandlebarsApplicationMixin(ApplicationV2) {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        tag: 'form',
        id: 'daggerheart-appearance-settings',
        classes: ['daggerheart', 'dialog', 'dh-style', 'setting'],
        position: { width: '600', height: 'auto' },
        window: {
            title: 'DAGGERHEART.SETTINGS.Menu.title',
            icon: 'fa-solid fa-gears'
        },
        actions: {
            reset: DHAppearanceSettings.#onReset,
            preview: DHAppearanceSettings.#onPreview
        },
        form: {
            closeOnSubmit: true,
            handler: DHAppearanceSettings.#onSubmit
        }
    };

    static PARTS = {
        header: { template: 'systems/daggerheart/templates/settings/appearance-settings/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        main: { template: 'systems/daggerheart/templates/settings/appearance-settings/main.hbs' },
        diceSoNice: { template: 'systems/daggerheart/templates/settings/appearance-settings/diceSoNice.hbs' },
        footer: { template: 'templates/generic/form-footer.hbs' }
    };

    /** @inheritdoc */
    static TABS = {
        general: {
            tabs: [
                { id: 'main', label: 'DAGGERHEART.GENERAL.Tabs.general' },
                { id: 'diceSoNice', label: 'DAGGERHEART.SETTINGS.Menu.appearance.diceSoNice.title' }
            ],
            initial: 'main'
        },
        diceSoNice: {
            tabs: [
                { id: 'hope', label: 'DAGGERHEART.GENERAL.hope' },
                { id: 'fear', label: 'DAGGERHEART.GENERAL.fear' },
                { id: 'advantage', label: 'DAGGERHEART.GENERAL.Advantage.full' },
                { id: 'disadvantage', label: 'DAGGERHEART.GENERAL.Disadvantage.full' }
            ],
            initial: 'hope'
        }
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

    /** @inheritdoc */
    _configureRenderParts(options) {
        const parts = super._configureRenderParts(options);
        if (!game.modules.get('dice-so-nice')?.active) {
            delete parts.diceSoNice;
            delete parts.tabs;
        }
        return parts;
    }

    /**@inheritdoc */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        if (options.isFirstRender)
            this.setting = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.appearance);

        context.setting = this.setting;
        context.fields = this.setting.schema.fields;

        context.tabs = this._prepareTabs('general');
        context.dsnTabs = this._prepareTabs('diceSoNice');

        return context;
    }

    /**@inheritdoc */
    async _preparePartContext(partId, context, options) {
        const partContext = await super._preparePartContext(partId, context, options);
        if (partId in context.tabs) partContext.tab = partContext.tabs[partId];
        switch (partId) {
            case 'diceSoNice':
                await this.prepareDiceSoNiceContext(partContext);
                break;
            case 'footer':
                partContext.buttons = [
                    { type: 'button', action: 'reset', icon: 'fa-solid fa-arrow-rotate-left', label: 'Reset' },
                    { type: 'submit', icon: 'fa-solid fa-floppy-disk', label: 'Save Changes' }
                ];
                break;
        }
        return partContext;
    }

    /**
     * Prepare render context for the DSN part.
     * @param {ApplicationRenderContext} context
     * @returns {Promise<void>}
     * @protected
     */
    async prepareDiceSoNiceContext(context) {
        context.diceSoNiceTextures = Object.entries(game.dice3d.exports.TEXTURELIST).reduce(
            (acc, [k, v]) => ({
                ...acc,
                [k]: v.name
            }),
            {}
        );
        context.diceSoNiceColorsets = Object.values(game.dice3d.exports.COLORSETS).reduce(
            (acc, v) => ({
                ...acc,
                [v.id]: v.description
            }),
            {}
        );
        context.diceSoNiceMaterials = Object.keys(game.dice3d.DiceFactory.material_options).reduce(
            (acc, key) => ({
                ...acc,
                [key]: `DICESONICE.Material${key.capitalize()}`
            }),
            {}
        );
        context.diceSoNiceSystems = Object.fromEntries(
            [...game.dice3d.DiceFactory.systems].map(([k, v]) => [k, v.name])
        );
        context.diceSoNiceFonts = game.dice3d.exports.Utils.prepareFontList();

        foundry.utils.mergeObject(
            context.dsnTabs,
            ['hope', 'fear', 'advantage', 'disadvantage'].reduce(
                (acc, key) => ({
                    ...acc,
                    [key]: {
                        values: this.setting.diceSoNice[key],
                        fields: this.setting.schema.getField(`diceSoNice.${key}`).fields
                    }
                }),
                {}
            )
        );
    }

    /**
     * Submit the configuration form.
     * @this {DHAppearanceSettings}
     * @param {SubmitEvent} event
     * @param {HTMLFormElement} form
     * @param {foundry.applications.ux.FormDataExtended} formData
     * @returns {Promise<void>}
     */
    static async #onSubmit(event, form, formData) {
        const data = this.setting.schema.clean(foundry.utils.expandObject(formData.object));
        await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.appearance, data);
    }

    /* -------------------------------------------- */

    /**
     * Submit the configuration form.
     * @this {DHAppearanceSettings}
     * @type {ApplicationClickAction}
     */
    static async #onPreview(_, target) {
        const formData = new foundry.applications.ux.FormDataExtended(target.closest('form'));
        const { diceSoNice } = foundry.utils.expandObject(formData.object);
        const { key } = target.dataset;
        const faces = ['advantage', 'disadvantage'].includes(key) ? 'd6' : 'd12';
        const preset = await getDiceSoNicePreset(diceSoNice[key], faces);
        const diceSoNiceRoll = await new foundry.dice.Roll(`1${faces}`).evaluate();
        diceSoNiceRoll.dice[0].options.appearance = preset.appearance;
        diceSoNiceRoll.dice[0].options.modelFile = preset.modelFile;
        await game.dice3d.showForRoll(diceSoNiceRoll, game.user, false);
    }

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
