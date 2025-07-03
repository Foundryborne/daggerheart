/**
 * @typedef {Object} FilterItem
 * @property {string} group - The group name this filter belongs to (e.g., "Type").
 * @property {string} name - The display name of the filter (e.g., "Weapons").
 * @property {import("@client/applications/ux/search-filter.mjs").FieldFilter} filter - The filter condition.
 */

export default class FilterMenu extends foundry.applications.ux.ContextMenu {
    /**
     * Filter Menu
     * @param {HTMLElement} container - Container element
     * @param {string} selector - CSS selector for menu targets
     * @param {Array} menuItems - Array of menu entries
     * @param {Function} callback - Callback when filters change
     * @param {Object} [options] - Additional options
     */
    constructor(container, selector, menuItems, callback, options = {}) {
        // Set default options
        const mergedOptions = {
            eventName: 'click',
            fixed: true,
            ...options
        };

        super(container, selector, menuItems, mergedOptions);

        // Initialize filter states
        this.menuItems = menuItems.map(item => ({
            ...item,
            enabled: false
        }));

        this.callback = callback;
        this.contentElement = container.querySelector(mergedOptions.contentSelector);

        const syntheticEvent = {
            type: 'pointerdown',
            bubbles: true,
            cancelable: true,
            pointerType: 'mouse',
            isPrimary: true,
            button: 0
        };

        this.callback(syntheticEvent, this.contentElement, this.getActiveFilterData());
    }

    /** @inheritdoc */
    async render(target, options = {}) {
        await super.render(target, { ...options, animate: false });

        // Create menu structure
        const menu = document.createElement('menu');
        menu.className = 'filter-menu';

        // Group items by their group property
        const groups = this.#groupItems(this.menuItems);

        // Create sections for each group
        for (const [groupName, items] of Object.entries(groups)) {
            if (!items.length) continue;

            const section = this.#createSection(groupName, items);
            menu.appendChild(section);
        }

        // Update menu and set position
        this.element.replaceChildren(menu);

        menu.addEventListener('click', this.#handleClick.bind(this));

        this._setPosition(this.element, target, options);

        if (options.animate !== false) await this._animate(true);
        return this._onRender(options);
    }

    /**
     * Groups an array of items by their `group`.
     * @param {Array<Object>} items - The array of items to group. Each item is expected to have an optional `group` property.
     * @returns {Object<string, Array<Object>>} An object where keys are group names and values are arrays of items belonging to each group.
     */
    #groupItems(items) {
        return items.reduce((groups, item) => {
            const group = item.group ?? '_none';
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    }

    /**
     * Creates a DOM section element for a group of items with corresponding filter buttons.
     * @param {string} groupName - The name of the group, used as the section label.
     * @param {Array<Object>} items - The items to create buttons for. Each item should have:
     * @returns {HTMLDivElement} The section DOM element containing the label and buttons.
     */
    #createSection(groupName, items) {
        const section = document.createElement('fieldset');
        section.className = 'filter-section';

        const header = document.createElement('legend');
        header.textContent = groupName;
        section.appendChild(header);

        const buttons = document.createElement('div');
        buttons.className = 'filter-buttons';

        items.forEach(item => {
            const button = document.createElement('button');
            button.className = `filter-button ${item.enabled ? 'active' : ''}`;
            button.textContent = item.name;
            item.element = button;
            buttons.appendChild(button);
        });

        section.appendChild(buttons);
        return section;
    }

    /**
     * Get filter data from active filters
     * @returns {Array} Array of filter configurations
     */
    getActiveFilterData() {
        return this.menuItems.filter(item => item.enabled).map(item => item.filter);
    }

    /**
     * Handles click events on filter buttons.
     * Toggles the active state of the clicked button and updates the corresponding item's `enabled` state.
     * Then triggers the provided callback with the event, the content element, and the current active filter data.
     * @param {PointerEvent} event - The click event triggered by interacting with a filter button.
     * @returns {void}
     */
    #handleClick(event) {
        event.preventDefault();
        event.stopPropagation();

        const button = event.target.closest('.filter-button');
        if (!button) return;

        const clickedItem = this.menuItems.find(item => item.element === button);
        if (!clickedItem) return;

        const isActive = button.classList.toggle('active');
        clickedItem.enabled = isActive;

        const filters = this.getActiveFilterData();

        if (filters.length > 0) {
            this.target.classList.add('fa-beat', 'active');
        } else {
            this.target.classList.remove('fa-beat', 'active');
        }

        this.callback(event, this.contentElement, filters);
    }

    /**
     * Generate and return a sorted array of inventory filters.
     * @returns {Array<Object>} An array of filter objects, sorted by name within each group.
     */
    static get invetoryFilters() {
        const { OPERATORS } = foundry.applications.ux.SearchFilter;

        const typesFilters = Object.entries(CONFIG.Item.dataModels)
            .filter(([, { metadata }]) => metadata.isInventoryItem)
            .map(([type, { metadata }]) => ({
                group: game.i18n.localize('Type'),
                name: game.i18n.localize(metadata.label),
                filter: {
                    field: 'type',
                    operator: OPERATORS.EQUALS,
                    value: type
                }
            }));

        const burdenFilter = Object.values(CONFIG.daggerheart.GENERAL.burden).map(({ value, label }) => ({
            group: game.i18n.localize('DAGGERHEART.Sheets.Weapon.Burden'),
            name: game.i18n.localize(label),
            filter: {
                field: 'system.burden',
                operator: OPERATORS.EQUALS,
                value: value
            }
        }));

        const damageTypeFilter = Object.values(CONFIG.daggerheart.GENERAL.damageTypes).map(({ id, abbreviation }) => ({
            group: 'Damage Type', //TODO localize
            name: game.i18n.localize(abbreviation),
            filter: {
                field: 'system.damage.type',
                operator: OPERATORS.EQUALS,
                value: id
            }
        }));

        return [
            ...game.i18n.sortObjects(typesFilters, 'name'),
            ...game.i18n.sortObjects(burdenFilter, 'name'),
            ...game.i18n.sortObjects(damageTypeFilter, 'name')
        ];
    }

    /**
     * Generate and return a sorted array of inventory filters.
     * @returns {Array<Object>} An array of filter objects, sorted by name within each group.
     */
    static get cardsFilters() {
        const { OPERATORS } = foundry.applications.ux.SearchFilter;

        const typesFilters = Object.values(CONFIG.daggerheart.DOMAIN.cardTypes).map(({ id, label }) => ({
            group: game.i18n.localize('Type'),
            name: game.i18n.localize(label),
            filter: {
                field: 'system.type',
                operator: OPERATORS.EQUALS,
                value: id
            }
        }));

        const domainFilter = Object.values(CONFIG.daggerheart.DOMAIN.domains).map(({ id, label }) => ({
            group: game.i18n.localize('DAGGERHEART.Sheets.DomainCard.Domain'),
            name: game.i18n.localize(label),
            filter: {
                field: 'system.domain',
                operator: OPERATORS.EQUALS,
                value: id
            }
        }));

        const sort = arr => game.i18n.sortObjects(arr, 'name');

        return [...sort(typesFilters), ...sort(domainFilter)];
    }
}
