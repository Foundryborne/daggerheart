const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class CompendiumBrowserSettings extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor() {
        super();

        this.browserSettings = game.settings
            .get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.CompendiumBrowserSettings)
            .toObject();
    }

    static DEFAULT_OPTIONS = {
        tag: 'div',
        classes: ['daggerheart', 'dialog', 'dh-style', 'views', 'compendium-brower-settings'],
        window: {
            icon: 'fa-solid fa-book',
            title: 'DAGGERHEART.APPLICATIONS.CompendiumBrowserSettings.title'
        },
        position: {
            width: 500
        },
        actions: {
            toggleSource: CompendiumBrowserSettings.#toggleSource,
            finish: CompendiumBrowserSettings.#finish
        }
    };

    /** @override */
    static PARTS = {
        packs: {
            id: 'packs',
            template: 'systems/daggerheart/templates/dialogs/compendiumBrowserSettingsDialog/packs.hbs'
        },
        footer: { template: 'systems/daggerheart/templates/dialogs/compendiumBrowserSettingsDialog/footer.hbs' }
    };

    static #browserPackTypes = ['Actor', 'Item'];

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        for (const element of htmlElement.querySelectorAll('.pack-checkbox'))
            element.addEventListener('change', this.toggleTypedPack.bind(this));
    }

    /**@inheritdoc */
    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);

        const excludedSourceData = this.browserSettings.excludedSources;
        const excludedPackData = this.browserSettings.excludedPacks;
        context.typePackCollections = game.packs.reduce((acc, pack) => {
            const { type, label, packageType, packageName, id } = pack.metadata;
            if (packageType === 'world' || !CompendiumBrowserSettings.#browserPackTypes.includes(type)) return acc;

            const sourceChecked =
                !excludedSourceData[packageName] ||
                !excludedSourceData[packageName].excludedDocumentTypes.includes(type);
            const sourceLabel = game.modules.get(packageName)?.title ?? game.system.title;
            if (!acc[type]) acc[type] = { label: game.i18n.localize(`DOCUMENT.${type}s`), sources: {} };
            if (!acc[type].sources[packageName])
                acc[type].sources[packageName] = { label: sourceLabel, checked: sourceChecked, packs: [] };

            const checked = !excludedPackData[id] || !excludedPackData[id].excludedDocumentTypes.includes(type);

            acc[type].sources[packageName].packs.push({
                pack: id,
                type,
                label: id === game.system.id ? game.system.title : game.i18n.localize(label),
                checked: checked
            });

            return acc;
        }, {});

        return context;
    }

    static #toggleSource(event, button) {
        event.stopPropagation();

        const { type, source } = button.dataset;
        const currentlyExcluded = this.browserSettings.excludedSources[source]
            ? this.browserSettings.excludedSources[source].excludedDocumentTypes.includes(type)
            : false;

        if (!this.browserSettings.excludedSources[source])
            this.browserSettings.excludedSources[source] = { excludedDocumentTypes: [] };
        this.browserSettings.excludedSources[source].excludedDocumentTypes = currentlyExcluded
            ? this.browserSettings.excludedSources[source].excludedDocumentTypes.filter(x => x !== type)
            : [...(this.browserSettings.excludedSources[source]?.excludedDocumentTypes ?? []), type];

        const toggleIcon = button.querySelector('a > i');
        toggleIcon.classList.toggle('fa-toggle-off');
        toggleIcon.classList.toggle('fa-toggle-on');
        button.closest('.source-container').querySelector('.checks-container').classList.toggle('collapsed');
    }

    toggleTypedPack(event) {
        event.stopPropagation();

        const { type, pack } = event.target.dataset;
        const currentlyExcluded = this.browserSettings.excludedPacks[pack]
            ? this.browserSettings.excludedPacks[pack].excludedDocumentTypes.includes(type)
            : false;

        if (!this.browserSettings.excludedPacks[pack])
            this.browserSettings.excludedPacks[pack] = { excludedDocumentTypes: [] };
        this.browserSettings.excludedPacks[pack].excludedDocumentTypes = currentlyExcluded
            ? this.browserSettings.excludedPacks[pack].excludedDocumentTypes.filter(x => x !== type)
            : [...(this.browserSettings.excludedPacks[pack]?.excludedDocumentTypes ?? []), type];

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

        this.updated = true;
        this.close();
    }

    static async configure() {
        return new Promise(resolve => {
            const app = new this();
            app.addEventListener('close', () => resolve(app.updated), { once: true });
            app.render({ force: true });
        });
    }
}
