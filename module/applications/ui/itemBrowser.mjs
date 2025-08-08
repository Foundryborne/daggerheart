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
        this.presets = options.presets;

        if(this.presets?.compendium && this.presets?.folder)
            ItemBrowser.selectFolder.call(this, null, null, this.presets.compendium, this.presets.folder);
    }

    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        id: 'itemBrowser',
        classes: ['daggerheart', 'dh-style', 'dialog', 'compendium-browser'],
        tag: 'div',
        // title: 'Item Browser',
        window: {
            frame: true,
            title: 'Compendium Browser',
            icon: 'fa-solid fa-book-atlas',
            positioned: true,
            resizable: true
        },
        actions: {
            selectFolder: this.selectFolder,
            expandContent: this.expandContent,
            resetFilters: this.resetFilters,
            sortList: this.sortList
        },
        position: {
            top: 330,
            left: 120,
            width: 800,
            height: 600
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
    async _preFirstRender(context, options) {
        if(context.presets?.render?.noFolder || context.presets?.render?.lite)
            options.position.width = 600;
        
        await super._preFirstRender(context, options);
    }

    /** @inheritDoc */
    async _preRender(context, options) {

        if(context.presets?.render?.noFolder || context.presets?.render?.lite)
            options.parts.splice(options.parts.indexOf('sidebar'), 1);

        await super._preRender(context, options);
    }

    /** @inheritDoc */
    async _onRender(context, options) {
        await super._onRender(context, options);

        this._createSearchFilter();
        this._createFilterInputs();
        this._createDragProcess();
        
        if(context.presets?.render?.lite)
            this.element.classList.add('lite');
        
        if(context.presets?.render?.noFolder)
            this.element.classList.add('no-folder');
        
        if(context.presets?.render?.noFilter)
            this.element.classList.add('no-filter');

        if(this.presets?.filter) {
            Object.entries(this.presets.filter).forEach(([k,v]) => this.fieldFilter.find(c => c.name === k).value = v.value);
            await this._onInputFilterBrowser();
        }
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
        context.fieldFilter = this.fieldFilter = this._createFieldFilter();
        context.items = this.items;
        context.presets = this.presets;
        return context;
    }

    getCompendiumFolders(config, parent = null, depth = 0) {
        let folders = [];
        Object.values(config).forEach(c => {
            const folder = {
                id: c.id,
                label: c.label,
                selected: (!parent || parent.selected) && this.selectedMenu.path[depth] === c.id
            };
            folder.folders = c.folders
                ? ItemBrowser.sortBy(this.getCompendiumFolders(c.folders, folder, depth + 2), 'label')
                : [];
            folders.push(folder);
        });

        return folders;
    }

    static async selectFolder(_, target, compend, folder) {
        const config = foundry.utils.deepClone(this.config),
            compendium = compend ?? target.closest('[data-compendium-id]').dataset.compendiumId,
            folderId = folder ?? target.dataset.folderId,
            folderPath = `${compendium}.folders.${folderId}`,
            folderData = foundry.utils.getProperty(config, folderPath);

        this.selectedMenu = {
            path: folderPath.split('.'),
            data: {
                ...folderData,
                columns: ItemBrowser.getFolderConfig(folderData)
            }
        };

        let items = [];
        for (const key of folderData.keys) {
            const comp = game.packs.get(`${compendium}.${key}`);
            if (!comp) return;
            items = items.concat(await comp.getDocuments({ type__in: folderData.type }));
        }

        this.items = ItemBrowser.sortBy(items, 'name');
        this.render({ force: true });
    }

    static expandContent(_, target) {
        const parent = target.parentElement;
        parent.classList.toggle('expanded');
    }

    static sortBy(data, property) {
        return data.sort((a, b) => (a[property] > b[property] ? 1 : -1));
    }

    formatLabel(item, field) {
        const property = foundry.utils.getProperty(item, field.key);
        if (typeof field.format !== 'function') return property ?? '-';
        return field.format(property);
    }

    formatChoices(data) {
        if (!data.field.choices) return null;
        const config = {
            choices: data.field.choices
        };
        foundry.data.fields.StringField._prepareChoiceConfig(config);
        return config.options.filter(
            c => data.filtered.includes(c.value) || data.filtered.includes(c.label.toLowerCase())
        );
    }

    _createFieldFilter() {
        const filters = ItemBrowser.getFolderConfig(this.selectedMenu.data, 'filters');
        filters.forEach(f => {
            if (typeof f.field === 'string') f.field = foundry.utils.getProperty(game, f.field);
            else if (typeof f.choices === 'function') {
                f.choices = f.choices();
            }
            f.name ??= f.key;
            f.value = this.presets?.filter?.[f.name]?.value ?? null;
        });
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
                input: 'input[type="search"].search-input',
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
                callback: this._onInputFilterBrowser.bind(this)
            }
        ];

        inputs.forEach(m => {
            const container = this.element.querySelector(m.container);
            if (!container) return (this.#input[m.key] = {});
            const inputs = container.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.addEventListener('change', this._onInputFilterBrowser.bind(this));
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
        }
    }

    /**
     * Callback when filters change
     * @param {PointerEvent} event
     * @param {HTMLElement} html
     */
    async _onInputFilterBrowser(event) {
        this.#filteredItems.browser.input.clear();

        if(event) this.fieldFilter.find(f => f.name === event.target.name).value = event.target.value;

        for (const li of this.element.querySelectorAll('.item-container')) {
            const itemUUID = li.dataset.itemUuid,
                item = this.items.find(i => i.uuid === itemUUID);
            
            if(!item) continue;

            const matchesMenu =
                this.fieldFilter.length === 0 ||
                this.fieldFilter.every(f => (
                    !f.value && f.value !== false) ||
                    ItemBrowser.evaluateFilter(item, this.createFilterData(f))
                );
            if (matchesMenu) this.#filteredItems.browser.input.add(item.id);

            const { search } = this.#filteredItems.browser;
            li.hidden = !(search.has(item.id) && matchesMenu);
        }
    }
    
    /**
     * Foundry evaluateFilter doesn't allow you to match if filter values are included into item data
     * @param {*} obj 
     * @param {*} filter 
     */
    static evaluateFilter(obj, filter) {
        let docValue = foundry.utils.getProperty(obj, filter.field);
        let filterValue = filter.value;
        switch (filter.operator) {
            case "contains2":
                filterValue = Array.isArray(filterValue) ? filterValue : [filterValue];
                docValue = Array.isArray(docValue) ? docValue : [docValue];
                return docValue.some(dv => filterValue.includes(dv));
            case "contains3":
                return docValue.some(f => f.value === filterValue);
            default:
                return foundry.applications.ux.SearchFilter.evaluateFilter(obj, filter);
        }
    }

    createFilterData(filter) {
        return {
            field: filter.key,
            value: isNaN(filter.value)
                ? ['true', 'false'].includes(filter.value)
                    ? filter.value === 'true'
                    : filter.value
                : Number(filter.value),
            operator: filter.operator,
            negate: filter.negate
        };
    }

    static resetFilters() {
        this.render({ force: true });
    }

    static getFolderConfig(folder, property = "columns") {
        if(!folder) return [];
        return folder[property] ?? CONFIG.DH.ITEMBROWSER.typeConfig[folder.listType]?.[property] ?? [];
    }

    static sortList(_, target) {
        const key = target.dataset.sortKey,
            type = !target.dataset.sortType || target.dataset.sortType === "DESC" ? "ASC" : "DESC",
            itemListContainer = target.closest(".compendium-results").querySelector(".item-list"),
            itemList = itemListContainer.querySelectorAll(".item-container");

        target.closest(".item-list-header").querySelectorAll('[data-sort-key]').forEach(b => b.dataset.sortType = "");
        target.dataset.sortType = type;
        
        const newOrder = [...itemList].reverse().sort((a, b) => {
            const aProp = a.querySelector(`[data-item-key="${key}"]`),
                bProp = b.querySelector(`[data-item-key="${key}"]`)
            if(type === "DESC") {
                return aProp.innerText < bProp.innerText ? 1 : -1;
            } else {
                return aProp.innerText > bProp.innerText ? 1 : -1;
            }
        });
        
        itemListContainer.replaceChildren(...newOrder);
    }

    _createDragProcess() {
        new foundry.applications.ux.DragDrop.implementation({
            dragSelector: '.item-container',
            permissions: {
                dragstart: this._canDragStart.bind(this)
            },
            callbacks: {
                dragstart: this._onDragStart.bind(this)
            }
        }).bind(this.element);
    }

    async _onDragStart(event) {
        const { itemUuid } = event.target.closest('[data-item-uuid]').dataset,
            item = await foundry.utils.fromUuid(itemUuid),
            dragData = item.toDragData();
        event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    }

    _canDragStart() {
        return true;
    }
}
