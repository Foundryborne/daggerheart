import { getDiceSoNicePreset } from '../../config/generalConfig.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

const fields = foundry.data.fields;

/** 
 * A base settings config that can handle multiple settings in the same form.
 * Currently only used by the DSN settings, which don't need multi setting support (at least not in-form).
 * TODO: should merge with existing settings to prevent overwrite
 */
class BaseSettingsConfig extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        actions: {
            reset: this.#onReset
        },
        form: {
            closeOnSubmit: true,
            handler: this.#onSubmit
        }
    }
    
    static get SETTINGS() {
        return [];
    }

    /** @inheritdoc */
    async _prepareContext(options = {}) {
        const context = await super._prepareContext(options);
        if (options.isFirstRender) {
            this.setting = this._prepareSettingData();
            this.mergedSchema = this._prepareSettingSchema();
        }

        context.setting = this.setting;
        context.fields = this.mergedSchema.fields;
        context.isGM = game.user.isGM;
        return context;
    }
    
    /** Prepares a merged view of all settings indexed by the setting key */
    _prepareSettingData() {
        const values = {};
        for (const key of this.constructor.SETTINGS) {
            values[key] = game.settings.get(CONFIG.DH.id, key);
        }
        return values;
    }

    /** Prepares a merge schemafield of all settings */
    _prepareSettingSchema() {
        const schema = {};
        for (const key of this.constructor.SETTINGS) {
            const metadata = game.settings.settings.get(`${CONFIG.DH.id}.${key}`);
            const isModel = foundry.abstract.DataModel.isPrototypeOf(metadata.type);
            if (!isModel) throw Error('Primitives not supported yet'); // todo: support, pull hint and label from metadata
            schema[key] = new fields.SchemaField(metadata.type.defineSchema());
        }
        return new fields.SchemaField(schema);
    }

    /**
     * Reset the form back to default values.
     * @this {BaseSettingsConfig}
     * @type {ApplicationClickAction}
     */
    static async #onReset() {
        this.setting = this.mergedSchema.getInitialValue();
        this.render({ force: false });
    }

    /**
     * Submit the configuration form.
     * @this {BaseSettingsConfig}
     * @param {SubmitEvent} event
     * @param {HTMLFormElement} form
     * @param {foundry.applications.ux.FormDataExtended} formData
     * @returns {Promise<void>}
     */
    static async #onSubmit(_event, _form, formData) {
        const expanded = foundry.utils.expandObject(formData.object);
        const data = this.mergedSchema.clean(expanded);
        for (const [key, value] of Object.entries(data)) {
            await game.settings.set(CONFIG.DH.id, key, value);
        }
    }
}

/**
 * Main config for dice so nice settings.
 * This also attempts a more generic approach at multi-setting configs, which should be considered for adoption in others.
 */
export class DhDiceSoNiceSettings extends BaseSettingsConfig {
    /** @inheritdoc */
    static DEFAULT_OPTIONS = {
        tag: 'form',
        id: 'daggerheart-dsn-settings',
        classes: ['daggerheart', 'dialog', 'dh-style', 'setting', 'dsn-settings'],
        position: { width: '600', height: 'auto' },
        window: {
            title: 'DAGGERHEART.SETTINGS.Menu.title',
            icon: 'fa-solid fa-gears'
        },
        actions: {
            preview: this.#onPreview
        }
    }
    
    static get SETTINGS() {
        return [CONFIG.DH.SETTINGS.gameSettings.diceSoNice];
    }

    static PARTS = {
        diceSoNice: { template: 'systems/daggerheart/templates/settings/dice-so-nice/main.hbs' },
        footer: { template: 'templates/generic/form-footer.hbs' }
    };

    /** @inheritdoc */
    static TABS = {
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

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        if (options.isFirstRender) {
            this.globalOverrides = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.GlobalOverrides);
        }

        context.globalOverrides = this.globalOverrides;
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

    /** @inheritdoc */
    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        htmlElement
            .querySelector('.default-animations-input')
            ?.addEventListener('change', this.toggleSFXOverride.bind(this));
    }
    
    /**
     * Prepare render context for the DSN part.
     * @param {ApplicationRenderContext} context
     * @returns {Promise<void>}
     * @protected
     */
    async prepareDiceSoNiceContext(context) {
        context.animationEvents = CONFIG.DH.GENERAL.daggerheartDiceAnimationEvents;
        context.previewAnimation = this.previewAnimation;

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

        const getAnimationsOptions = key => {
            const fields = context.fields.diceSoNice.fields[key].fields.sfx.fields;
            return {
                higher: fields.higher.fields.class.choices
            };
        };

        foundry.utils.mergeObject(
            context.dsnTabs,
            ['hope', 'fear', 'advantage', 'disadvantage'].reduce(
                (acc, key) => ({
                    ...acc,
                    [key]: {
                        values: this.setting.diceSoNice[key],
                        fields: this.mergedSchema.getField(`diceSoNice.${key}`).fields,
                        animations: ['hope', 'fear'].includes(key) ? getAnimationsOptions(key) : {}
                    }
                }),
                {}
            )
        );
    }
    
    async toggleSFXOverride(event) {
        await this.globalOverrides.diceSoNiceSFXUpdate(this.setting.diceSoNice, event.target.checked);
        this.globalOverrides = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.GlobalOverrides);
        this.render();
    }

    /**
     * Submit the configuration form.
     * @this {DhDiceSoNiceSettings}
     * @type {ApplicationClickAction}
     */
    static async #onPreview(_, target) {
        const formData = new foundry.applications.ux.FormDataExtended(target.closest('form'));
        const { diceSoNice, ...rest } = foundry.utils.expandObject(formData.object);
        const { key } = target.dataset;
        const faces = ['advantage', 'disadvantage'].includes(key) ? 'd6' : 'd12';
        const preset = await getDiceSoNicePreset(diceSoNice[key], faces);
        const diceSoNiceRoll = await new foundry.dice.Roll(`1${faces}`).evaluate();
        diceSoNiceRoll.dice[0].options.appearance = preset.appearance;
        diceSoNiceRoll.dice[0].options.modelFile = preset.modelFile;

        const previewAnimation = rest[`${key}PreviewAnimation`];
        const events = CONFIG.DH.GENERAL.daggerheartDiceAnimationEvents;
        if (previewAnimation) {
            if (previewAnimation === events.critical.id && diceSoNice.sfx.critical.class) {
                diceSoNiceRoll.dice[0].options.sfx = { specialEffect: diceSoNice.sfx.critical.class };
            }
            if (previewAnimation === events.higher.id && diceSoNice[key].sfx.higher) {
                diceSoNiceRoll.dice[0].options.sfx = { specialEffect: diceSoNice[key].sfx.higher.class };
            }
        }

        await game.dice3d.showForRoll(diceSoNiceRoll, game.user, false);
    }
}