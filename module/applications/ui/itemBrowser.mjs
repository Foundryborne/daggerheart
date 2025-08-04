
const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

/**
 * A UI element which displays the Users defined for this world.
 * Currently active users are always displayed, while inactive users can be displayed on toggle.
 *
 * @extends ApplicationV2
 * @mixes HandlebarsApplication
 */

export class ItemBrowser extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options = {}) {
        super(options);
        this.items = [];
        this.fieldFilter = [];
        this.selectedMenu = { path: [], data: null };
        this.config = CONFIG.DH.ITEMBROWSER.compendiumConfig;
    }

    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        id: 'itemBrowser',
        classes: ['dh-style'],
        tag: 'div',
        // title: 'Item Browser',
        window: {
            frame: true,
            title: 'Item Browser',
            positioned: true,
            resizable: true
        },
        actions: {
            selectFolder: this.selectFolder,
            expandContent: this.expandContent,
            resetFilters: this.resetFilters
        },
        position: {
            width: 1000,
            height: 800
            // top: "200px",
            // left: "120px"
        }
    };

    /** @override */
    static PARTS = {
        sidebar: {
            template: 'systems/daggerheart/templates/ui/itemBrowser/sidebar.hbs'
        },
        list: {
            template: 'systems/daggerheart/templates/ui/itemBrowser/itemBrowser.hbs'
        }
    };

    /* -------------------------------------------- */
    /*  Filter Tracking                             */
    /* -------------------------------------------- */

    /**
     * The currently active search filter.
     * @type {foundry.applications.ux.SearchFilter}
     */
    #search = {};
    
    #input = {};

    /**
     * Tracks which item IDs are currently displayed, organized by filter type and section.
     * @type {{
     *   inventory: {
     *     search: Set<string>,
     *     input: Set<string>
     *   }
     * }}
     */
    #filteredItems = {
        browser: {
            search: new Set(),
            input: new Set()
        }
    };

    /** @inheritDoc */
    async _onRender(context, options) {
        await super._onRender(context, options);
        
        this._createSearchFilter();
        this._createFilterInputs();
        this._createDragProcess();
    }

    /* -------------------------------------------- */
    /*  Rendering                                   */
    /* -------------------------------------------- */

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.compendiums = this.getCompendiumFolders(foundry.utils.deepClone(this.config));
        // context.pathTitle = this.pathTile;
        context.menu = this.selectedMenu;
        context.formatLabel = this.formatLabel;
        context.formatChoices = this.formatChoices;
        context.fieldFilter = this.fieldFilter = this.selectedMenu.data?.filters ? this._createFieldFilter() : [];
        context.items = this.items;
        console.log(this.items)
        return context;
    }

    getCompendiumFolders(config, parent = null, depth = 0) {
        let folders = [];
        Object.values(config).forEach(c => {
            const folder = {
                id: c.id,
                label: c.label,
                selected: (!parent || parent.selected) && this.selectedMenu.path[depth] === c.id
            }
            folder.folders = c.folders ? ItemBrowser.sortBy(this.getCompendiumFolders(c.folders, folder, depth + 2), 'label') : [];
            // sortBy(Object.values(c.folders), 'label')
            folders.push(folder)
        })

        // console.log(folders)
        return folders;
    }

    static async selectFolder(_, target) {
        const config = foundry.utils.deepClone(this.config),
            compendium = target.closest('[data-compendium-id]').dataset.compendiumId,
            folderId = target.dataset.folderId,
            folderPath = `${compendium}.folders.${folderId}`,
            folderData = foundry.utils.getProperty(config, folderPath);

        this.selectedMenu = {
            path: folderPath.split('.'),
            data: folderData
        }
        
        let items = [];
        for(const key of folderData.keys) {
            const comp = game.packs.get(`${compendium}.${key}`);
            if(!comp) return;
            items = items.concat(await comp.getDocuments({ type__in: folderData.type }));
        }

        this.items = ItemBrowser.sortBy(items, 'name');
        this.render({ force: true });
    }

    static expandContent(_, target) {
        const parent = target.parentElement;
        parent.classList.toggle("expanded");
    }

    static sortBy(data, property) {
        return data.sort((a, b) => a[property] > b[property] ? 1 : -1)
    }

    formatLabel(item, field) {
        const property = foundry.utils.getProperty(item, field.key);
        if(typeof field.format !== 'function') return property;
        return field.format(property);
    }

    formatChoices(data) {
        if(!data.field.choices) return null;
        const config = {
            choices: data.field.choices
        };
        foundry.data.fields.StringField._prepareChoiceConfig(config);
        return config.options.filter(c => data.filtered.includes(c.value) || data.filtered.includes(c.label.toLowerCase()));
    }

    _createFieldFilter() {
        const filters = [];
        this.selectedMenu.data.filters.forEach(f => {
            if(typeof f.field === 'string')
                f.field = foundry.utils.getProperty(game, f.field);
            else if(typeof f.choices === 'function')
                f.choices = f.choices();
            filters.push(f)
        })
        return filters;
    }

    /* -------------------------------------------- */
    /*  Search Inputs                               */
    /* -------------------------------------------- */

    /**
     * Create and initialize search filter instances for the inventory and loadout sections.
     *
     * Sets up two {@link foundry.applications.ux.SearchFilter} instances:
     * - One for the inventory, which filters items in the inventory grid.
     * - One for the loadout, which filters items in the loadout/card grid.
     * @private
     */
    _createSearchFilter() {
        //Filters could be a application option if needed
        const filters = [
            {
                key: 'browser',
                input: 'input[type="search"].search-browser',
                content: '[data-application-part="list"] .item-list',
                callback: this._onSearchFilterBrowser.bind(this)
            }
        ];

        for (const { key, input, content, callback } of filters) {
            const filter = new foundry.applications.ux.SearchFilter({
                inputSelector: input,
                contentSelector: content,
                callback
            });
            filter.bind(this.element);
            this.#search[key] = filter;
        }
    }
    
    /* -------------------------------------------- */
    /*  Filter Inputs                                */
    /* -------------------------------------------- */

    _createFilterInputs() {
        const inputs = [
            {
                key: 'browser',
                container: '[data-application-part="list"] .filter-content .wrapper',
                content: '[data-application-part="list"] .item-list',
                callback: this._onInputFilterBrowser.bind(this),
                // target: '.filter-button',
                // filters: FilterMenu.invetoryFilters
            }
        ];

        inputs.forEach(m => {
            const container = this.element.querySelector(m.container);
            if(!container) return this.#input[m.key] = {};
            const inputs = container.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.addEventListener('change', this._onInputFilterBrowser.bind(this))
            });
            this.#filteredItems[m.key].input = new Set(this.items.map(i => i.id));
            this.#input[m.key] = inputs;
        });
    }
    
    /**
     * Handle invetory items search and filtering.
     * @param {KeyboardEvent} event  The keyboard input event.
     * @param {string} query         The input search string.
     * @param {RegExp} rgx           The regular expression query that should be matched against.
     * @param {HTMLElement} html     The container to filter items from.
     * @protected
     */
    async _onSearchFilterBrowser(event, query, rgx, html) {
        this.#filteredItems.browser.search.clear();

        for (const li of html.querySelectorAll('.item-container')) {
            const itemUUID = li.dataset.itemUuid,
                item = this.items.find(i => i.uuid === itemUUID);
            const matchesSearch = !query || foundry.applications.ux.SearchFilter.testQuery(rgx, item.name);
            if (matchesSearch) this.#filteredItems.browser.search.add(item.id);
            const { input } = this.#filteredItems.browser;
            li.hidden = !(input.has(item.id) && matchesSearch);
            // li.hidden = !(matchesSearch);
        }
    }
    
    /**
     * Callback when filters change
     * @param {PointerEvent} event
     * @param {HTMLElement} html
     */
    async _onInputFilterBrowser(event) {
        this.#filteredItems.browser.input.clear();

        console.log(event.target.name)

        this.fieldFilter.find(f => f.key === event.target.name).value = event.target.value;

        // console.log(_event, html, filters)

        for (const li of event.target.closest('[data-application-part="list"]').querySelectorAll('.item-container')) {
            const itemUUID = li.dataset.itemUuid,
                item = this.items.find(i => i.uuid === itemUUID);

            const matchesMenu =
                this.fieldFilter.length === 0 || this.fieldFilter.every(f => {
                    return (!f.value && f.value !== false) || foundry.applications.ux.SearchFilter.evaluateFilter(item, this.createFilterData(f))
                });
            if (matchesMenu) this.#filteredItems.browser.input.add(item.id);

            const { search } = this.#filteredItems.browser;
            li.hidden = !(search.has(item.id) && matchesMenu);
            // li.hidden = !(matchesMenu);
        }
    }

    createFilterData(filter) {
        return {
            field: filter.key,
            value: isNaN(filter.value) ? (["true", "false"].includes(filter.value) ? filter.value === "true" : filter.value) : Number(filter.value),
            operator: filter.operator,
            negate: filter.negate
        }
    }

    static resetFilters() {
        this.render({ force: true });
    }

    /**
     * Serialize salient information about this Document when dragging it.
     * @returns {object}  An object of drag data.
     */
    // toDragData() {
    //   const dragData = {type: this.documentName};
    //   if ( this.id ) dragData.uuid = this.uuid;
    //   else dragData.data = this.toObject();
    //   return dragData;
    // }

    _createDragProcess() {
        new foundry.applications.ux.DragDrop.implementation({
            dragSelector: ".item-container",
            // dropSelector: ".directory-list",
            permissions: {
                dragstart: this._canDragStart.bind(this),
                // drop: this._canDragDrop.bind(this)
            },
            callbacks: {
                // dragover: this._onDragOver.bind(this),
                dragstart: this._onDragStart.bind(this),
                // drop: this._onDrop.bind(this)
            }
        }).bind(this.element);
        // this.element.querySelectorAll(".directory-item.folder").forEach(folder => {
        //     folder.addEventListener("dragenter", this._onDragHighlight.bind(this));
        //     folder.addEventListener("dragleave", this._onDragHighlight.bind(this));
        // });
    }

    async _onDragStart(event) {
        // console.log(event)
        // ui.context?.close({ animate: false });
        const { itemUuid } = event.target.closest('[data-item-uuid]').dataset;
        const dragData = foundry.utils.fromUuidSync(itemUuid).toDragData();
        // console.log(dragData)
        // const dragData = { UUID: itemUuid };
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }

    _canDragStart() {
        return true;
    }
}