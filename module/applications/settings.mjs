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

export const registerDHPSettings = () => {
    // const debouncedReload = foundry.utils.debounce(() => window.location.reload(), 100);

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
        default: 0
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
};

// const {HandlebarsApplicationMixin, ApplicationV2} = foundry.applications.api;

// export default class DhpSettings extends HandlebarsApplicationMixin(ApplicationV2) {
//     constructor(actor, shortrest){
//         super({});

//         this.actor = actor;
//         this.selectedActivity = null;
//         this.shortrest = shortrest;

//         this.customActivity = SYSTEM.GENERAL.downtime.custom;
//     }

//     get title(){
//         return game.i18n.localize("DAGGERHEART.Application.Settings.Title");
//     }

//     static DEFAULT_OPTIONS = {
//         tag: 'form',
//         classes: ["daggerheart", "application", "settings"],
//         position: { width: 800, height: 'auto' },
//         actions: {
//             selectActivity: this.selectActivity,
//         },
//         form: { handler: this.updateData }
//     };

//     static PARTS = {
//         application: {
//             id: "settings",
//             template: "systems/daggerheart/templates/application/settings.hbs"
//         }
//     }

//     async _prepareContext(_options) {
//         const context = await super._prepareContext(_options);

//         return context;
//     }

//     static async updateData(event, element, formData){
//         this.render();
//     }

//     static close(){
//         super.close();
//     }
// }
