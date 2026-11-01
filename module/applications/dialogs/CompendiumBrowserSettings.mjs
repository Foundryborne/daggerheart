const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class CompendiumBrowserSettings extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(attributionSourceOptions, campaignFrameOptions) {
        super();

        this.attributionSourceOptions = attributionSourceOptions;
        this.campaignFrameOptions = campaignFrameOptions;
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
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
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

    /** @inheritdoc */
    static TABS = {
        primary: {
            tabs: [{ id: 'sources' }, { id: 'compendiumPacks' }],
            initial: 'sources',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    static #browserPackTypes = ['Actor', 'Item'];

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        for (const element of htmlElement.querySelectorAll('.pack-checkbox'))
            element.addEventListener('change', this.toggleTypedPack.bind(this));

        for (const element of htmlElement.querySelectorAll('.attribution-source-checkbox'))
            element.addEventListener('change', this.toggleAttributionSource.bind(this));

        for (const element of htmlElement.querySelectorAll('.campaign-frame-checkbox'))
            element.addEventListener('change', this.toggleCampaignFrame.bind(this));
    }

    /**@inheritdoc */
    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);

        context.excludedAttributionSources = this.browserSettings.excludedAttributionSources;
        context.excludedCampaignFrames = this.browserSettings.excludedCampaignFrames;

        context.sources = {
            attributionSources: {
                label: _loc('DAGGERHEART.APPLICATIONS.CompendiumBrowserSettings.sources'),
                entries: this.attributionSourceOptions.map(x => ({
                    label: x, 
                    checked: !this.browserSettings.excludedAttributionSources.includes(x),
                    class: 'attribution-source-checkbox'
                }))
            },
            campaignFrames: {
                label: _loc('DAGGERHEART.APPLICATIONS.CompendiumBrowserSettings.campaignFrames'),
                entries: this.campaignFrameOptions.map(x => ({ 
                    label: x, 
                    checked: !this.browserSettings.excludedCampaignFrames.includes(x),
                    class: 'campaign-frame-checkbox'  
                }))
            }
        };

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

    toggleAttributionSource(event) {
        const key = event.target.dataset.key;
        const sources = this.browserSettings.excludedAttributionSources;
        if (sources.find(x => x === key)) 
            this.browserSettings.excludedAttributionSources = sources.filter(x => x !== key);  
        else 
            this.browserSettings.excludedAttributionSources.push(key);
        
        this.render();
    }

    toggleCampaignFrame(_event, button) {
        const key = event.target.dataset.key;
        const sources = this.browserSettings.excludedCampaignFrames;
        if (sources.find(x => x === key)) 
            this.browserSettings.excludedCampaignFrames = sources.filter(x => x !== key);  
        else 
            this.browserSettings.excludedCampaignFrames.push(key);
        
        this.render();
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
        const attributionSourceOptions = [];
        const campaignFrameOptions = [];
        for (const pack of game.packs.filter(x => ['Actor', 'Item'].includes(x.metadata.type))) {
            const indexes = await pack.getIndex({ fields: ['system.attribution.source', 'system.attribution.campaignFrame'] });
            for (const index of indexes) {
                const { source, campaignFrame } = index.system.attribution;
                if (source && !attributionSourceOptions.includes(source))
                    attributionSourceOptions.push(source);
                if (campaignFrame && !campaignFrameOptions.includes(campaignFrame))
                    campaignFrameOptions.push(campaignFrame);
            }
        }

        return new Promise(resolve => {
            const app = new this(attributionSourceOptions, campaignFrameOptions);
            app.addEventListener('close', () => resolve(app.updated), { once: true });
            app.render({ force: true });
        });
    }
}
