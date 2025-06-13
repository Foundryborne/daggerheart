import { DualityRollColor } from '../config/settingsConfig.mjs';
import { defaultLevelTiers, DhLevelTiers } from '../data/levelTier.mjs';
import DhAppearance from '../data/settings/Appearance.mjs';
import DHAppearanceSettings from './settings/appearanceSettings.mjs';
import DhVariantRules from '../data/settings/VariantRules.mjs';
import DHVariantRuleSettings from './settings/variantRuleSettings.mjs';

class DhpAutomationSettings extends FormApplication {
    constructor(object = {}, options = {}) {
        super(object, options);
    }

    static get defaultOptions() {
        const defaults = super.defaultOptions;
        const overrides = {
            height: 'auto',
            width: 400,
            id: 'daggerheart-automation-settings',
            template: 'systems/daggerheart/templates/views/automation-settings.hbs',
            closeOnSubmit: true,
            submitOnChange: false,
            classes: ['daggerheart', 'views', 'settings']
        };

        const mergedOptions = foundry.utils.mergeObject(defaults, overrides);

        return mergedOptions;
    }

    async getData() {
        const context = super.getData();
        context.settings = SYSTEM.SETTINGS.gameSettings.Automation;
        context.hope = await game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Automation.Hope);
        context.actionPoints = await game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Automation.ActionPoints);

        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    async _updateObject(_, formData) {
        const data = foundry.utils.expandObject(formData);
        const updateSettingsKeys = Object.keys(data);
        for (var i = 0; i < updateSettingsKeys.length; i++) {
            await game.settings.set(SYSTEM.id, updateSettingsKeys[i], data[updateSettingsKeys[i]]);
        }
    }
}

class DhpHomebrewSettings extends FormApplication {
    constructor(object = {}, options = {}) {
        super(object, options);
    }

    static get defaultOptions() {
        const defaults = super.defaultOptions;
        const overrides = {
            height: 'auto',
            width: 400,
            id: 'daggerheart-homebrew-settings',
            template: 'systems/daggerheart/templates/views/homebrew-settings.hbs',
            closeOnSubmit: true,
            submitOnChange: false,
            classes: ['daggerheart', 'views', 'settings']
        };

        const mergedOptions = foundry.utils.mergeObject(defaults, overrides);

        return mergedOptions;
    }

    async getData() {
        const context = super.getData();
        context.settings = SYSTEM.SETTINGS.gameSettings.General;
        context.abilityArray = await game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.General.AbilityArray);

        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    async _updateObject(_, formData) {
        const data = foundry.utils.expandObject(formData);
        const updateSettingsKeys = Object.keys(data);
        for (var i = 0; i < updateSettingsKeys.length; i++) {
            await game.settings.set(SYSTEM.id, updateSettingsKeys[i], data[updateSettingsKeys[i]]);
        }
    }
}

class DhpRangeSettings extends FormApplication {
    constructor(object = {}, options = {}) {
        super(object, options);

        this.range = game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.General.RangeMeasurement);
    }

    static get defaultOptions() {
        const defaults = super.defaultOptions;
        const overrides = {
            height: 'auto',
            width: 400,
            id: 'daggerheart-range-settings',
            template: 'systems/daggerheart/templates/views/range-settings.hbs',
            closeOnSubmit: false,
            submitOnChange: true,
            classes: ['daggerheart', 'views', 'settings']
        };

        const mergedOptions = foundry.utils.mergeObject(defaults, overrides);

        return mergedOptions;
    }

    async getData() {
        const context = super.getData();
        context.settings = SYSTEM.SETTINGS.gameSettings.General;
        context.range = this.range;
        context.disabled =
            context.range.enabled &&
            [
                context.range.melee,
                context.range.veryClose,
                context.range.close,
                context.range.far,
                context.range.veryFar
            ].some(x => x === null || x === false);

        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('.range-reset').click(this.reset.bind(this));
        html.find('.save').click(this.save.bind(this));
        html.find('.close').click(this.close.bind(this));
    }

    async _updateObject(_, formData) {
        const data = foundry.utils.expandObject(formData, { disabled: true });
        this.range = foundry.utils.mergeObject(this.range, data);
        this.render(true);
    }

    reset() {
        this.range = {
            enabled: false,
            melee: 5,
            veryClose: 15,
            close: 30,
            far: 60,
            veryFar: 120
        };
        this.render(true);
    }

    async save() {
        await game.settings.set(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.General.RangeMeasurement, this.range);
        this.close();
    }
}

export const registerDHSettings = () => {
    game.settings.register(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.General.AbilityArray, {
        name: game.i18n.localize('DAGGERHEART.Settings.General.AbilityArray.Name'),
        hint: game.i18n.localize('DAGGERHEART.Settings.General.AbilityArray.Hint'),
        scope: 'world',
        config: false,
        type: String,
        default: '[2,1,1,0,0,-1]'
    });

    game.settings.register(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Resources.Fear, {
        name: game.i18n.localize('DAGGERHEART.Settings.Resources.Fear.Name'),
        hint: game.i18n.localize('DAGGERHEART.Settings.Resources.Fear.Hint'),
        scope: 'world',
        config: false,
        type: Number,
        default: 0,
        onChange: () => {
            if (ui.resources) ui.resources.render({ force: true });
            ui.combat.render({ force: true });
        }
    });

    game.settings.register(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Resources.MaxFear, {
        name: game.i18n.localize('DAGGERHEART.Settings.Resources.MaxFear.Name'),
        hint: game.i18n.localize('DAGGERHEART.Settings.Resources.MaxFear.Hint'),
        scope: 'world',
        config: true,
        type: Number,
        default: 12,
        onChange: () => {
            if (ui.resources) ui.resources.render({ force: true });
        }
    });

    game.settings.register(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Resources.DisplayFear, {
        name: game.i18n.localize('DAGGERHEART.Settings.Resources.DisplayFear.Name'),
        hint: game.i18n.localize('DAGGERHEART.Settings.Resources.DisplayFear.Hint'),
        scope: 'client',
        config: true,
        type: String,
        choices: {
            token: 'Tokens',
            bar: 'Bar',
            hide: 'Hide'
        },
        default: 'token',
        onChange: value => {
            if (ui.resources) {
                if (value === 'hide') ui.resources.close({ allowed: true });
                else ui.resources.render({ force: true });
            }
        }
    });

    game.settings.register(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Automation.Hope, {
        name: game.i18n.localize('DAGGERHEART.Settings.Automation.Hope.Name'),
        hint: game.i18n.localize('DAGGERHEART.Settings.Automation.Hope.Hint'),
        scope: 'world',
        config: false,
        type: Boolean,
        default: false
    });

    game.settings.register(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Automation.ActionPoints, {
        name: game.i18n.localize('DAGGERHEART.Settings.Automation.ActionPoints.Name'),
        hint: game.i18n.localize('DAGGERHEART.Settings.Automation.ActionPoints.Hint'),
        scope: 'world',
        config: false,
        type: Boolean,
        default: true
    });

    game.settings.register(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.General.RangeMeasurement, {
        name: game.i18n.localize('DAGGERHEART.Settings.General.RangeMeasurement.Name'),
        hint: game.i18n.localize('DAGGERHEART.Settings.General.RangeMeasurement.Hint'),
        scope: 'world',
        config: false,
        type: Object,
        default: {
            enabled: true,
            melee: 5,
            veryClose: 15,
            close: 30,
            far: 60,
            veryFar: 120
        }
    });

    game.settings.register(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.variantRules, {
        scope: 'world',
        config: false,
        type: DhVariantRules,
        default: DhVariantRules.defaultSchema
    });

    game.settings.register(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.appearance, {
        scope: 'client',
        config: false,
        type: DhAppearance,
        default: DhAppearance.defaultSchema
    });

    game.settings.register(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.DualityRollColor, {
        name: game.i18n.localize('DAGGERHEART.Settings.DualityRollColor.Name'),
        hint: game.i18n.localize('DAGGERHEART.Settings.DualityRollColor.Hint'),
        scope: 'world',
        config: false,
        type: Number,
        choices: Object.values(DualityRollColor),
        default: DualityRollColor.colorful.value
    });

    game.settings.register(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.LevelTiers, {
        scope: 'world',
        config: false,
        type: DhLevelTiers,
        default: defaultLevelTiers
    });

    game.settings.registerMenu(SYSTEM.id, SYSTEM.SETTINGS.menu.Automation.Name, {
        name: game.i18n.localize('DAGGERHEART.Settings.Menu.Automation.Name'),
        label: game.i18n.localize('DAGGERHEART.Settings.Menu.Automation.Label'),
        hint: game.i18n.localize('DAGGERHEART.Settings.Menu.Automation.Hint'),
        icon: SYSTEM.SETTINGS.menu.Automation.Icon,
        type: DhpAutomationSettings,
        restricted: true
    });
    game.settings.registerMenu(SYSTEM.id, SYSTEM.SETTINGS.menu.Homebrew.Name, {
        name: game.i18n.localize('DAGGERHEART.Settings.Menu.Homebrew.Name'),
        label: game.i18n.localize('DAGGERHEART.Settings.Menu.Homebrew.Label'),
        hint: game.i18n.localize('DAGGERHEART.Settings.Menu.Homebrew.Hint'),
        icon: SYSTEM.SETTINGS.menu.Homebrew.Icon,
        type: DhpHomebrewSettings,
        restricted: true
    });
    game.settings.registerMenu(SYSTEM.id, SYSTEM.SETTINGS.menu.Range.Name, {
        name: game.i18n.localize('DAGGERHEART.Settings.Menu.Range.Name'),
        label: game.i18n.localize('DAGGERHEART.Settings.Menu.Range.Label'),
        hint: game.i18n.localize('DAGGERHEART.Settings.Menu.Range.Hint'),
        icon: SYSTEM.SETTINGS.menu.Range.Icon,
        type: DhpRangeSettings,
        restricted: true
    });

    game.settings.registerMenu(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.appearance, {
        name: game.i18n.localize('DAGGERHEART.Settings.Menu.Appearance.title'),
        label: game.i18n.localize('DAGGERHEART.Settings.Menu.Appearance.label'),
        hint: game.i18n.localize('DAGGERHEART.Settings.Menu.Appearance.hint'),
        icon: 'fa-solid fa-palette',
        type: DHAppearanceSettings,
        restricted: false
    });

    game.settings.registerMenu(SYSTEM.id, SYSTEM.SETTINGS.menu.VariantRules.Name, {
        name: game.i18n.localize('DAGGERHEART.Settings.Menu.VariantRules.title'),
        label: game.i18n.localize('DAGGERHEART.Settings.Menu.VariantRules.label'),
        hint: game.i18n.localize('DAGGERHEART.Settings.Menu.VariantRules.hint'),
        icon: SYSTEM.SETTINGS.menu.VariantRules.Icon,
        type: DHVariantRuleSettings,
        restricted: false
    });
};
