export const keybindings = {
    spotlight: 'DHSpotlight',
    partySheet: 'DHPartySheet'
};

export const menu = {
    Automation: {
        Name: 'GameSettingsAutomation',
        Icon: 'fa-solid fa-robot'
    },
    Metagaming: {
        Name: 'GameSettingsMetagaming',
        Icon: 'fa-solid fa-eye-low-vision'
    },
    Homebrew: {
        Name: 'GameSettingsHomebrew',
        Icon: 'fa-solid fa-flask-vial'
    },
    Range: {
        Name: 'GameSettingsRange',
        Icon: 'fa-solid fa-ruler'
    },
    VariantRules: {
        Name: 'GameSettingsVariantrules',
        Icon: 'fa-solid fa-scale-balanced'
    }
};

export const gameSettings = {
    /** @type {'Automation'} */
    Automation: 'Automation',
    Metagaming: 'Metagaming',
    /** @type {'Homebrew'} */
    Homebrew: 'Homebrew',
    appearance: 'Appearance',
    GlobalOverrides: 'GlobalOverrides',
    variantRules: 'VariantRules',
    Resources: {
        Fear: 'ResourcesFear'
    },
    LevelTiers: 'LevelTiers',
    /** @type {'Countdowns'} */
    Countdowns: 'Countdowns',
    LastMigrationVersion: 'LastMigrationVersion',
    SpotlightRequestQueue: 'SpotlightRequestQueue',
    CompendiumBrowserSettings: 'CompendiumBrowserSettings',
    SpotlightTracker: 'SpotlightTracker',
    ActiveParty: 'ActiveParty'
};

export const actionAutomationChoices = {
    never: {
        id: 'never',
        label: 'DAGGERHEART.CONFIG.ActionAutomationChoices.never'
    },
    showDialog: {
        id: 'showDialog',
        label: 'DAGGERHEART.CONFIG.ActionAutomationChoices.showDialog'
    },
    always: {
        id: 'always',
        label: 'DAGGERHEART.CONFIG.ActionAutomationChoices.always'
    }
};

export const reloadChoices = {
    off: {
        id: 'off',
        label: 'DAGGERHEART.CONFIG.ReloadChoices.off.label'
    },
    manual: {
        id: 'manual',
        label: 'DAGGERHEART.CONFIG.ReloadChoices.manual.label'
    },
    auto: {
        id: 'auto',
        label: 'DAGGERHEART.CONFIG.ReloadChoices.auto.label'
    }
};