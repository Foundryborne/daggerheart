import { defaultLevelTiers, DhLevelTiers } from '../data/levelTier.mjs';
import DhCountdowns from '../data/countdowns.mjs';
import {
    DhAppearance,
    DhAutomation,
    DhHomebrew,
    DhRangeMeasurement,
    DhVariantRules
} from '../data/settings/_module.mjs';
import {
    DhAppearanceSettings,
    DhAutomationSettings,
    DhHomebrewSettings,
    DhRangeMeasurementSettings,
    DhVariantRuleSettings
} from './settings/_module.mjs';

export const registerDHSettings = () => {
    registerMenuSettings();
    registerMenus();
    registerNonConfigSettings();
};

const registerMenuSettings = () => {
    game.settings.register(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.variantRules, {
        scope: 'world',
        config: false,
        type: DhVariantRules
    });

    game.settings.register(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Automation, {
        scope: 'world',
        config: false,
        type: DhAutomation
    });

    game.settings.register(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Homebrew, {
        scope: 'world',
        config: false,
        type: DhHomebrew,
        onChange: value => {
            if (value.maxFear) {
                if (ui.resources) ui.resources.render({ force: true });
            }
        }
    });

    game.settings.register(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.appearance, {
        scope: 'client',
        config: false,
        type: DhAppearance,
        onChange: value => {
            if (value.displayFear) {
                if (ui.resources) {
                    if (value.displayFear === 'hide') ui.resources.close({ allowed: true });
                    else ui.resources.render({ force: true });
                }
            }
        }
    });

    game.settings.register(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.RangeMeasurement, {
        scope: 'client',
        config: false,
        type: DhRangeMeasurement
    });
};

const registerMenus = () => {
    game.settings.registerMenu(SYSTEM.id, SYSTEM.SETTINGS.menu.Automation.Name, {
        name: game.i18n.localize('DAGGERHEART.Settings.Menu.Automation.Name'),
        label: game.i18n.localize('DAGGERHEART.Settings.Menu.Automation.Label'),
        hint: game.i18n.localize('DAGGERHEART.Settings.Menu.Automation.Hint'),
        icon: SYSTEM.SETTINGS.menu.Automation.Icon,
        type: DhAutomationSettings,
        restricted: true
    });
    game.settings.registerMenu(SYSTEM.id, SYSTEM.SETTINGS.menu.Homebrew.Name, {
        name: game.i18n.localize('DAGGERHEART.Settings.Menu.Homebrew.Name'),
        label: game.i18n.localize('DAGGERHEART.Settings.Menu.Homebrew.Label'),
        hint: game.i18n.localize('DAGGERHEART.Settings.Menu.Homebrew.Hint'),
        icon: SYSTEM.SETTINGS.menu.Homebrew.Icon,
        type: DhHomebrewSettings,
        restricted: true
    });
    game.settings.registerMenu(SYSTEM.id, SYSTEM.SETTINGS.menu.Range.Name, {
        name: game.i18n.localize('DAGGERHEART.Settings.Menu.Range.Name'),
        label: game.i18n.localize('DAGGERHEART.Settings.Menu.Range.Label'),
        hint: game.i18n.localize('DAGGERHEART.Settings.Menu.Range.Hint'),
        icon: SYSTEM.SETTINGS.menu.Range.Icon,
        type: DhRangeMeasurementSettings,
        restricted: true
    });

    game.settings.registerMenu(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.appearance, {
        name: game.i18n.localize('DAGGERHEART.Settings.Menu.Appearance.title'),
        label: game.i18n.localize('DAGGERHEART.Settings.Menu.Appearance.label'),
        hint: game.i18n.localize('DAGGERHEART.Settings.Menu.Appearance.hint'),
        icon: 'fa-solid fa-palette',
        type: DhAppearanceSettings,
        restricted: false
    });

    game.settings.registerMenu(SYSTEM.id, SYSTEM.SETTINGS.menu.VariantRules.Name, {
        name: game.i18n.localize('DAGGERHEART.Settings.Menu.VariantRules.title'),
        label: game.i18n.localize('DAGGERHEART.Settings.Menu.VariantRules.label'),
        hint: game.i18n.localize('DAGGERHEART.Settings.Menu.VariantRules.hint'),
        icon: SYSTEM.SETTINGS.menu.VariantRules.Icon,
        type: DhVariantRuleSettings,
        restricted: false
    });
};

const registerNonConfigSettings = () => {
    game.settings.register(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.LevelTiers, {
        scope: 'world',
        config: false,
        type: DhLevelTiers,
        default: defaultLevelTiers
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

    game.settings.register(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Countdowns, {
        scope: 'world',
        config: false,
        type: DhCountdowns
    });
};
