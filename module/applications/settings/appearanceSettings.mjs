import DhAppearance from '../../data/settings/Appearance.mjs';
import { getDiceSoNicePreset } from '../../config/generalConfig.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DHAppearanceSettings extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor() {
        super({});

        this.settings = new DhAppearance(
            game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.appearance).toObject()
        );
    }

    get title() {
        return game.i18n.localize('DAGGERHEART.SETTINGS.Menu.title');
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        id: 'daggerheart-appearance-settings',
        classes: ['daggerheart', 'dialog', 'dh-style', 'setting'],
        position: { width: '600', height: 'auto' },
        window: {
            icon: 'fa-solid fa-gears'
        },
        actions: {
            reset: this.reset,
            save: this.save,
            preview: this.preview
        },
        form: { handler: this.updateData, submitOnChange: true }
    };

    static PARTS = {
        main: {
            template: 'systems/daggerheart/templates/settings/appearance-settings.hbs'
        }
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

    changeTab(tab, group, options) {
        super.changeTab(tab, group, options);

        this.render();
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.settingFields = this.settings;

        context.showDiceSoNice = game.modules.get('dice-so-nice')?.active;
        if (game.dice3d) {
            context.diceSoNiceTextures = game.dice3d.exports.TEXTURELIST;
            context.diceSoNiceColorsets = game.dice3d.exports.COLORSETS;
            context.diceSoNiceMaterials = Object.keys(game.dice3d.DiceFactory.material_options).map(key => ({
                key: key,
                name: `DICESONICE.Material${key.capitalize()}`
            }));
            context.diceSoNiceSystems = [];
            for (const [key, system] of game.dice3d.DiceFactory.systems.entries()) {
                context.diceSoNiceSystems.push({ key, name: system.name });
            }
        }

        context.diceTab = {
            key: this.tabGroups.diceSoNice,
            source: this.settings._source.diceSoNice[this.tabGroups.diceSoNice],
            fields: this.settings.schema.fields.diceSoNice.fields[this.tabGroups.diceSoNice].fields
        };

        return context;
    }

    static async updateData(event, element, formData) {
        const updatedSettings = foundry.utils.expandObject(formData.object);

        await this.settings.updateSource(updatedSettings);
        this.render();
    }

    static async preview() {
        const source = this.settings._source.diceSoNice[this.tabGroups.diceSoNice];
        let faces = 'd12';
        switch (this.tabGroups.diceSoNice) {
            case 'advantage':
            case 'disadvantage':
                faces = 'd6';
        }
        const preset = await getDiceSoNicePreset(source, faces);
        const diceSoNiceRoll = await new Roll(`1${faces}`).evaluate();
        diceSoNiceRoll.dice[0].options.appearance = preset.appearance;
        diceSoNiceRoll.dice[0].options.modelFile = preset.modelFile;

        await game.dice3d.showForRoll(diceSoNiceRoll, game.user, false);
    }

    static async reset() {
        this.settings = new DhAppearance();
        this.render();
    }

    static async save() {
        await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.appearance, this.settings.toObject());

        this.close();
    }

    _getTabs(tabs) {
        for (const v of Object.values(tabs)) {
            v.active = this.tabGroups[v.group] ? this.tabGroups[v.group] === v.id : v.active;
            v.cssClass = v.active ? 'active' : '';
        }

        return tabs;
    }
}
