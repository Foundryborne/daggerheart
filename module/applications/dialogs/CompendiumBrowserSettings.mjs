const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class CompendiumBrowserSettings extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor() {
        super();

        this.browserSettings = game.settings
            .get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.CompendiumBrowserSettings)
            .toObject();
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'dialog', 'dh-style', 'views', 'compendium-brower-settings'],
        window: {
            icon: 'fa-solid fa-book',
            title: 'DAGGERHEART.APPLICATIONS.CompendiumBrowserSettings.title'
        },
        position: {
            width: 500,
            height: 'auto'
        },
        actions: {
            finish: CompendiumBrowserSettings.#finish
        },
        form: {
            handler: this.updateData,
            submitOnChange: true,
            submitOnClose: false
        }
    };

    /** @override */
    static PARTS = {
        main: {
            id: 'main',
            template: 'systems/daggerheart/templates/dialogs/compendiumBrowserSettingsDialog.hbs'
        }
    };

    static #browserPackTypes = ['Actor', 'Item'];

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        for (const element of htmlElement.querySelectorAll('.source-input')) {
            element.addEventListener('change', this.toggleSource.bind(this));
        }
    }

    getPackageName = pack => (pack.metadata.packageType === 'world' ? 'world' : pack.metadata.packageName);

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);

        const { excludedCompendiumPacks } = this.browserSettings;
        context.packOptions = game.packs.reduce((acc, pack) => {
            const { type, name, label, packageType, id } = pack.metadata;
            if (!CompendiumBrowserSettings.#browserPackTypes.includes(type)) return acc;

            const packageName = this.getPackageName(pack);
            if (!acc[packageName])
                acc[packageName] = {
                    label:
                        packageType === 'world'
                            ? game.i18n.localize('PACKAGE.Type.world')
                            : (game.modules.get(packageName)?.title ?? game.system.title),
                    types: {}
                };
            if (!acc[packageName].types[type])
                acc[packageName].types[type] = {
                    label: game.i18n.localize(`DOCUMENT.${type}`),
                    checked: true,
                    packs: {}
                };

            if (id === 'daggerheart.ancestries') {
                console.log('test');
            }
            acc[packageName].types[type].packs[id] = {
                label: label,
                checked: !excludedCompendiumPacks[packageName]?.[id]
            };
            acc[packageName].types[type].checked &&= acc[packageName].types[type].packs[id].checked;

            return acc;
        }, {});

        return context;
    }

    static async updateData(_event, _, formData) {
        const { excludedCompendiumPacks } = foundry.utils.expandObject(formData.object);
        this.browserSettings.excludedCompendiumPacks = Object.keys(excludedCompendiumPacks).reduce(
            (acc, packageKey) => {
                const flattenedPack = foundry.utils.flattenObject(excludedCompendiumPacks[packageKey]);
                acc[packageKey] = Object.keys(flattenedPack).reduce((acc, key) => {
                    acc[key] = !flattenedPack[key];
                    return acc;
                }, {});
                return acc;
            },
            {}
        );
        this.render();
    }

    toggleSource(event) {
        event.stopPropagation();

        const { excludedCompendiumPacks } = this.browserSettings;
        const { source, type } = event.target.dataset;

        const allIncluded = !event.target.checked;
        const packs = game.packs.filter(pack => this.getPackageName(pack) === source && pack.metadata.type === type);
        for (const pack of packs) {
            if (!excludedCompendiumPacks[source]) excludedCompendiumPacks[source] = {};

            excludedCompendiumPacks[source][pack.metadata.id] = allIncluded;
        }

        this.render();
    }

    static async #finish() {
        const settings = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.CompendiumBrowserSettings);
        await settings.updateSource(this.browserSettings);
        await game.settings.set(
            CONFIG.DH.id,
            CONFIG.DH.SETTINGS.gameSettings.CompendiumBrowserSettings,
            settings.toObject()
        );
        this.close();
    }
}
