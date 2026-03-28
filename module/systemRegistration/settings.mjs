import { defaultLevelTiers, DhLevelTiers } from '../data/levelTier.mjs';
import DhCountdowns from '../data/countdowns.mjs';
import {
    DhAppearance,
    DhAutomation,
    DhGlobalOverrides,
    DhHomebrew,
    DhMetagaming,
    DhVariantRules
} from '../data/settings/_module.mjs';
import {
    DhAppearanceSettings,
    DhAutomationSettings,
    DhHomebrewSettings,
    DhMetagamingSettings,
    DhVariantRuleSettings
} from '../applications/settings/_module.mjs';
import { CompendiumBrowserSettings } from '../data/_module.mjs';
import SpotlightTracker from '../data/spotlightTracker.mjs';

export const registerDHSettings = () => {
    registerKeyBindings();
    registerMenuSettings();
    registerMenus();
    registerNonConfigSettings();

    game.settings.register(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.SpotlightRequestQueue, {
        name: game.i18n.localize('DAGGERHEART.SETTINGS.Menu.SpotlightRequestQueue.name'),
        label: game.i18n.localize('DAGGERHEART.SETTINGS.Menu.SpotlightRequestQueue.label'),
        hint: game.i18n.localize('DAGGERHEART.SETTINGS.Menu.SpotlightRequestQueue.hint'),
        scope: 'world',
        config: true,
        type: Boolean,
        onChange: () => ui.combat.render()
    });
};

export const registerKeyBindings = () => {
    game.keybindings.register(CONFIG.DH.id, CONFIG.DH.SETTINGS.keybindings.spotlight, {
        name: game.i18n.localize('DAGGERHEART.SETTINGS.Keybindings.spotlight.name'),
        hint: game.i18n.localize('DAGGERHEART.SETTINGS.Keybindings.spotlight.hint'),
        uneditable: [],
        editable: [],
        onDown: () => {
            const selectedTokens = canvas.tokens.controlled.length > 0 ? canvas.tokens.controlled[0] : null;
            const hoveredTokens = game.canvas.tokens.hover ? game.canvas.tokens.hover : null;
            const tokens = selectedTokens ?? hoveredTokens;
            game.system.api.macros.spotlightCombatant(tokens);
        },
        onUp: () => {},
        restricted: true,
        reservedModifiers: [],
        precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
    });
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

    game.settings.register(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Metagaming, {
        scope: 'world',
        config: false,
        type: DhMetagaming
    });

    game.settings.register(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew, {
        scope: 'world',
        config: false,
        type: DhHomebrew,
        onChange: value => {
            value.handleChange();
        }
    });

    game.settings.register(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.GlobalOverrides, {
        scope: 'world',
        config: false,
        type: DhGlobalOverrides
    });

    game.settings.register(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.appearance, {
        scope: 'client',
        config: false,
        type: DhAppearance,
        onChange: value => {
            value.handleChange();
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

    game.settings.registerMenu(CONFIG.DH.id, CONFIG.DH.SETTINGS.menu.Metagaming.Name, {
        name: game.i18n.localize('DAGGERHEART.SETTINGS.Menu.metagaming.name'),
        label: game.i18n.localize('DAGGERHEART.SETTINGS.Menu.metagaming.label'),
        hint: game.i18n.localize('DAGGERHEART.SETTINGS.Menu.metagaming.hint'),
        icon: CONFIG.DH.SETTINGS.menu.Metagaming.Icon,
        type: DhMetagamingSettings,
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
        name: game.i18n.localize('DAGGERHEART.SETTINGS.Menu.appearance.label'),
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
        restricted: true
    });
};

const registerNonConfigSettings = () => {
    game.settings.register(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.LastMigrationVersion, {
        scope: 'world',
        config: false,
        type: String
    });

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
            if (ui.resources) ui.resources.render();
            ui.combat.render({ force: true });
        }
    });

    game.settings.register(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns, {
        scope: 'world',
        config: false,
        type: DhCountdowns
    });

    game.settings.register(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.CompendiumBrowserSettings, {
        scope: 'world',
        config: false,
        type: CompendiumBrowserSettings
    });

    game.settings.register(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.SpotlightTracker, {
        scope: 'world',
        config: false,
        type: SpotlightTracker
    });
};
