import { defaultLevelTiers, DhLevelTiers } from '../data/levelTier.mjs';
import DhCountdowns from '../data/countdowns.mjs';
import { DhAppearance, DhAutomation, DhHomebrew, DhVariantRules } from '../data/settings/_module.mjs';
import {
    DhAppearanceSettings,
    DhAutomationSettings,
    DhHomebrewSettings,
    DhVariantRuleSettings
} from '../applications/settings/_module.mjs';

export const registerDHSettings = () => {
    registerMenuSettings();
    registerMenus();
    registerNonConfigSettings();
};

const registerMenuSettings = () => {
    game.settings.register(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.variantRules, {
        scope: 'world',
        config: false,
        type: DhVariantRules
    });

    game.settings.register(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation, {
        scope: 'world',
        config: false,
        type: DhAutomation
    });

    game.settings.register(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew, {
        scope: 'world',
        config: false,
        type: DhHomebrew,
        onChange: value => {
            if (value.maxFear) {
                if (ui.resources) ui.resources.render({ force: true });
            }
        }
    });

    game.settings.register(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.appearance, {
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
};

const registerMenus = () => {
    game.settings.registerMenu(CONFIG.DH.id, CONFIG.DH.SETTINGS.menu.Automation.Name, {
        name: game.i18n.localize('DAGGERHEART.SETTINGS.Menu.automation.name'),
        label: game.i18n.localize('DAGGERHEART.SETTINGS.Menu.automation.label'),
        hint: game.i18n.localize('DAGGERHEART.SETTINGS.Menu.automation.hint'),
        icon: CONFIG.DH.SETTINGS.menu.Automation.Icon,
        type: DhAutomationSettings,
        restricted: true
    });
    game.settings.registerMenu(CONFIG.DH.id, CONFIG.DH.SETTINGS.menu.Homebrew.Name, {
        name: game.i18n.localize('DAGGERHEART.SETTINGS.Menu.homebrew.name'),
        label: game.i18n.localize('DAGGERHEART.SETTINGS.Menu.homebrew.label'),
        hint: game.i18n.localize('DAGGERHEART.SETTINGS.Menu.homebrew.hint'),
        icon: CONFIG.DH.SETTINGS.menu.Homebrew.Icon,
        type: DhHomebrewSettings,
        restricted: true
    });

    game.settings.registerMenu(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.appearance, {
        name: game.i18n.localize('DAGGERHEART.SETTINGS.Menu.appearance.title'),
        label: game.i18n.localize('DAGGERHEART.SETTINGS.Menu.appearance.label'),
        hint: game.i18n.localize('DAGGERHEART.SETTINGS.Menu.appearance.hint'),
        icon: 'fa-solid fa-palette',
        type: DhAppearanceSettings,
        restricted: false
    });

    game.settings.registerMenu(CONFIG.DH.id, CONFIG.DH.SETTINGS.menu.VariantRules.Name, {
        name: game.i18n.localize('DAGGERHEART.SETTINGS.Menu.variantRules.title'),
        label: game.i18n.localize('DAGGERHEART.SETTINGS.Menu.variantRules.label'),
        hint: game.i18n.localize('DAGGERHEART.SETTINGS.Menu.variantRules.hint'),
        icon: CONFIG.DH.SETTINGS.menu.VariantRules.Icon,
        type: DhVariantRuleSettings,
        restricted: false
    });
};

const registerNonConfigSettings = () => {
    game.settings.register(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.LevelTiers, {
        scope: 'world',
        config: false,
        type: DhLevelTiers,
        default: defaultLevelTiers
    });

    game.settings.register(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Resources.Fear, {
        name: game.i18n.localize('DAGGERHEART.SETTINGS.Resources.fear.name'),
        hint: game.i18n.localize('DAGGERHEART.SETTINGS.Resources.fear.hint'),
        scope: 'world',
        config: false,
        type: Number,
        default: 0,
        onChange: () => {
            if (ui.resources) ui.resources.render({ force: true });
            ui.combat.render({ force: true });
        }
    });

    game.settings.register(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns, {
        scope: 'world',
        config: false,
        type: DhCountdowns
    });
};
