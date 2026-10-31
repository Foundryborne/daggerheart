import { tagifyElement } from '../../helpers/utils.mjs';

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
        classes: ['daggerheart', 'dialog', 'dh-style', 'views', 'compendium-browser-settings'],
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
        attributionSources: {
            id: 'attribution-sources',
            template: 'systems/daggerheart/templates/dialogs/compendiumBrowserSettingsDialog/attribution-sources.hbs'
        },
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
    async _onRender(context, options) {
        await super._onRender(context, options);

        const element = this.element.querySelector('.attribution-source-input');
        const tagifyOptions = Object.keys(CONFIG.DH.GENERAL.attributionSources).flatMap(groupKey => {
            const group = CONFIG.DH.GENERAL.attributionSources[groupKey];
            return group.values.map(x => ({ id: x.label, ...x }));
        });
        tagifyElement(element, tagifyOptions, CompendiumBrowserSettings.#onAttributionSourceSelect.bind(this));
    }

    static async #onAttributionSourceSelect(selectedOptions) {
        const sources = this.browserSettings.excludedAttributionSources;
        const selectedFeatures = selectedOptions.map(x => x.value);
        const toRemove = sources.filter(x => !selectedFeatures.includes(x));
        const toAdd = selectedFeatures.filter(x => !sources.includes(x)); 
        this.browserSettings.excludedAttributionSources = [
            ...this.browserSettings.excludedAttributionSources.filter(x => !toRemove.includes(x)),
            ...toAdd
        ];
        this.render();
    }

    /**@inheritdoc */
    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);

        context.excludedAttributionSources = this.browserSettings.excludedAttributionSources;
        const excludedSourceData = this.browserSettings.excludedSources;
        const excludedPackData = this.browserSettings.excludedPacks;
        context.typePackCollections = game.packs.reduce((acc, pack) => {
            const { type, label, packageType, packageName: basePackageName, name, id } = pack.metadata;
            if (!CompendiumBrowserSettings.#browserPackTypes.includes(type)) return acc;

            const isWorldPack = packageType === 'world';
            const packageName = isWorldPack ? 'world' : basePackageName;
            const sourceChecked =
                !excludedSourceData[packageName] ||
                !excludedSourceData[packageName].excludedDocumentTypes.includes(type);

            const sourceLabel =
                game.modules.get(packageName)?.title ??
                (isWorldPack
                    ? game.i18n.localize('DAGGERHEART.APPLICATIONS.CompendiumBrowserSettings.worldCompendiums')
                    : game.system.title);
            if (!acc[type]) acc[type] = { label: game.i18n.localize(`DOCUMENT.${type}s`), sources: {} };
            if (!acc[type].sources[packageName])
                acc[type].sources[packageName] = { label: sourceLabel, checked: sourceChecked, packs: [] };

            const included =
                !excludedPackData[packageName] ||
                !excludedPackData[packageName][name]?.excludedDocumentTypes.includes(type);

            acc[type].sources[packageName].packs.push({
                name,
                type,
                label: id === game.system.id ? game.system.title : game.i18n.localize(label),
                checked: included
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

        const { type, source, packName } = event.target.dataset;
        const currentlyExcluded = this.browserSettings.excludedPacks[source]?.[packName]
            ? this.browserSettings.excludedPacks[source][packName].excludedDocumentTypes.includes(type)
            : false;

        this.browserSettings.excludedPacks[source] ??= {};
        this.browserSettings.excludedPacks[source][packName] ??= { excludedDocumentTypes: [] };
        this.browserSettings.excludedPacks[source][packName].excludedDocumentTypes = currentlyExcluded
            ? this.browserSettings.excludedPacks[source][packName].excludedDocumentTypes.filter(x => x !== type)
            : [...(this.browserSettings.excludedPacks[source][packName]?.excludedDocumentTypes ?? []), type];

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
