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
        this.presets = {};
        this.compendiumBrowserTypeKey = 'compendiumBrowserDefault';
    }

    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        id: 'itemBrowser',
        classes: ['daggerheart', 'dh-style', 'dialog', 'compendium-browser', 'daggerheart-loader'],
        tag: 'div',
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
            left: 100,
            width: 850,
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
    async _preRender(context, options) {
        this.presets = options.presets ?? {};
        const noFolder = this.presets?.render?.noFolder;
        if (noFolder === true) {
            this.compendiumBrowserTypeKey = 'compendiumBrowserNoFolder';
        }
        const lite = this.presets?.render?.lite;
        if (lite === true) {
            this.compendiumBrowserTypeKey = 'compendiumBrowserLite';
        }
        const userPresetPosition = game.user.getFlag(
            CONFIG.DH.id,
            CONFIG.DH.FLAGS[`${this.compendiumBrowserTypeKey}`].position
        );

        options.position = userPresetPosition ?? ItemBrowser.DEFAULT_OPTIONS.position;

        if (!userPresetPosition) {
            const width = noFolder === true || lite === true ? 600 : 850;
            if (this.rendered) this.setPosition({ width });
            else options.position.width = width;
        }

        await super._preRender(context, options);
    }

    /** @inheritDoc */
    async _onRender(context, options) {
        await super._onRender(context, options);

        this.element
            .querySelectorAll('[data-action="selectFolder"]')
            .forEach(element =>
                element.classList.toggle('is-selected', element.dataset.folderId === this.selectedMenu.path.join('.'))
            );

        this._createSearchFilter();

        this.element.classList.toggle('lite', this.presets?.render?.lite === true);
        this.element.classList.toggle('no-folder', this.presets?.render?.noFolder === true);
        this.element.classList.toggle('no-filter', this.presets?.render?.noFilter === true);
        this.element.querySelectorAll('.folder-list > [data-action="selectFolder"]').forEach(element => {
            element.hidden =
                this.presets.render?.folders?.length && !this.presets.render.folders.includes(element.dataset.folderId);
        });
    }

    _onPosition(position) {
        game.user.setFlag(CONFIG.DH.id, CONFIG.DH.FLAGS[`${this.compendiumBrowserTypeKey}`].position, position);
    }

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        htmlElement.querySelectorAll('[data-action="selectFolder"]').forEach(element =>
            element.addEventListener('contextmenu', event => {
                event.target.classList.toggle('expanded');
            })
        );
    }

    /* -------------------------------------------- */
    /*  Rendering                                   */
    /* -------------------------------------------- */

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.compendiums = this.getCompendiumFolders(foundry.utils.deepClone(this.config));
        context.menu = this.selectedMenu;
        context.formatLabel = this.formatLabel;
        context.formatChoices = this.formatChoices;
        context.items = this.items;
        context.presets = this.presets;
        return context;
    }

    open(presets = {}) {
        this.presets = presets;
        ItemBrowser.selectFolder.call(this);
    }

    getCompendiumFolders(config, parent = null, depth = 0) {
        let folders = [];
        Object.values(config).forEach(c => {
            // if(this.presets.render?.folders?.length && !this.presets.render.folders.includes(c.id)) return;
            const folder = {
                id: c.id,
                label: game.i18n.localize(c.label),
                selected: (!parent || parent.selected) && this.selectedMenu.path[depth] === c.id
            };
            folder.folders = c.folders
                ? ItemBrowser.sortBy(this.getCompendiumFolders(c.folders, folder, depth + 2), 'label')
                : [];
            folders.push(folder);
        });
        folders.sort((a, b) => a.label.localeCompare(b.label));

        return folders;
    }

    static async selectFolder(_, target) {
        const folderId = target?.dataset?.folderId ?? this.presets.folder,
            folderData = foundry.utils.getProperty(this.config, folderId) ?? {};

        const columns = ItemBrowser.getFolderConfig(folderData).map(col => ({
            ...col,
            label: game.i18n.localize(col.label)
        }));

        this.selectedMenu = {
            path: folderId?.split('.') ?? [],
            data: {
                ...folderData,
                columns: columns
            }
        };

        await this.render({ force: true, presets: this.presets });

        if (this.selectedMenu?.data?.type?.length) this.loadItems();
    }

    _replaceHTML(result, content, options) {
        if (!options.isFirstRender) delete result.sidebar;
        super._replaceHTML(result, content, options);
    }

    loadItems() {
        let loadTimeout = this.toggleLoader(true);

        const promises = [];

        game.packs.forEach(pack => {
            promises.push(
                new Promise(async resolve => {
                    const items = await pack.getDocuments({ type__in: this.selectedMenu?.data?.type });
                    resolve(items);
                })
            );
        });

        Promise.all(promises).then(async result => {
            this.items = ItemBrowser.sortBy(
                result.flatMap(r => r),
                'name'
            );
            this.fieldFilter = this._createFieldFilter();

            if (this.presets?.filter) {
                Object.entries(this.presets.filter).forEach(([k, v]) => {
                    const filter = this.fieldFilter.find(c => c.name === k);
                    if (filter) filter.value = v.value;
                });
                // await this._onInputFilterBrowser();
            }

            const filterList = await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/ui/itemBrowser/filterContainer.hbs',
                {
                    fieldFilter: this.fieldFilter,
                    presets: this.presets,
                    formatChoices: this.formatChoices
                }
            );

            this.element.querySelector('.filter-content .wrapper').innerHTML = filterList;
            const filterContainer = this.element.querySelector('.filter-header > [data-action="expandContent"]');
            if (this.fieldFilter.length === 0) filterContainer.setAttribute('disabled', '');
            else filterContainer.removeAttribute('disabled');

            const itemList = await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/ui/itemBrowser/itemContainer.hbs',
                {
                    items: this.items,
                    menu: this.selectedMenu,
                    formatLabel: this.formatLabel
                }
            );

            this.element.querySelector('.item-list').innerHTML = itemList;

            this._createFilterInputs();
            await this._onInputFilterBrowser();
            this._createDragProcess();

            clearTimeout(loadTimeout);
            this.toggleLoader(false);
        });
    }

    toggleLoader(state) {
        const container = this.element.querySelector('.item-list');
        return setTimeout(() => {
            container.classList.toggle('daggerheart-loader', state);
        }, 100);
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
        if (Array.isArray(property)) property.join(', ');
        if (typeof field.format !== 'function') return property ?? '-';
        return game.i18n.localize(field.format(property));
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
                f.choices = f.choices(this.items);
            }

            // Clear field label so template uses our custom label parameter
            if (f.field && f.label) {
                f.field.label = undefined;
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
     * Create and initialize search filter instance.
     *
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
            if (!item) continue;
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

        if (event) this.fieldFilter.find(f => f.name === event.target.name).value = event.target.value;

        for (const li of this.element.querySelectorAll('.item-container')) {
            const itemUUID = li.dataset.itemUuid,
                item = this.items.find(i => i.uuid === itemUUID);

            if (!item) continue;

            const matchesMenu =
                this.fieldFilter.length === 0 ||
                this.fieldFilter.every(
                    f => (!f.value && f.value !== false) || ItemBrowser.evaluateFilter(item, this.createFilterData(f))
                );
            if (matchesMenu) this.#filteredItems.browser.input.add(item.id);

            const { search } = this.#filteredItems.browser;
            li.hidden = !((this.#search.browser.query.length === 0 || search.has(item.id)) && matchesMenu);
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
            case 'contains2':
                filterValue = Array.isArray(filterValue) ? filterValue : [filterValue];
                docValue = Array.isArray(docValue) ? docValue : [docValue];
                return docValue.some(dv => filterValue.includes(dv));
            case 'contains3':
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
        this.loadItems();
    }

    static getFolderConfig(folder, property = 'columns') {
        if (!folder) return [];
        return folder[property] ?? CONFIG.DH.ITEMBROWSER.typeConfig[folder.listType]?.[property] ?? [];
    }

    static sortList(_, target) {
        const key = target.dataset.sortKey,
            type = !target.dataset.sortType || target.dataset.sortType === 'DESC' ? 'ASC' : 'DESC',
            itemListContainer = target.closest('.compendium-results').querySelector('.item-list'),
            itemList = itemListContainer.querySelectorAll('.item-container');

        target
            .closest('.item-list-header')
            .querySelectorAll('[data-sort-key]')
            .forEach(b => (b.dataset.sortType = ''));
        target.dataset.sortType = type;

        const newOrder = [...itemList].reverse().sort((a, b) => {
            const aProp = a.querySelector(`[data-item-key="${key}"]`),
                bProp = b.querySelector(`[data-item-key="${key}"]`),
                aValue = isNaN(aProp.innerText) ? aProp.innerText : Number(aProp.innerText),
                bValue = isNaN(bProp.innerText) ? bProp.innerText : Number(bProp.innerText);
            if (type === 'DESC') {
                return aValue < bValue ? 1 : -1;
            } else {
                return aValue > bValue ? 1 : -1;
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

    static injectSidebarButton(html) {
        if (!game.user.isGM) return;
        const sectionId = html.dataset.tab,
            menus = {
                actors: {
                    folder: 'adversaries',
                    render: {
                        folders: ['adversaries', 'characters', 'environments']
                    }
                },
                items: {
                    folder: 'equipments',
                    render: {
                        noFolder: true
                    }
                },
                compendium: {}
            };

        if (Object.keys(menus).includes(sectionId)) {
            const headerActions = html.querySelector('.header-actions');

            const button = document.createElement('button');
            button.type = 'button';
            button.classList.add('open-compendium-browser');
            button.innerHTML = `
                <i class="fa-solid fa-book-atlas"></i>
                ${game.i18n.localize('DAGGERHEART.UI.Tooltip.compendiumBrowser')}
            `;
            button.addEventListener('click', event => {
                ui.compendiumBrowser.open(menus[sectionId]);
            });

            headerActions.append(button);
        }
    }
}
