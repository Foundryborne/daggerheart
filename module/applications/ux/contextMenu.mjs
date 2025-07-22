/**
 * @typedef ContextMenuEntry
 * @property {string} name                              The context menu label. Can be localized.
 * @property {string} [icon]                            A string containing an HTML icon element for the menu item.
 * @property {string} [classes]                         Additional CSS classes to apply to this menu item.
 * @property {string} [group]                           An identifier for a group this entry belongs to.
 * @property {ContextMenuJQueryCallback} callback       The function to call when the menu item is clicked.
 * @property {ContextMenuCondition|boolean} [condition] A function to call or boolean value to determine if this entry
 *                                                      appears in the menu.
 */

/**
 * @callback ContextMenuCondition
 * @param {jQuery|HTMLElement} html                     The element of the context menu entry.
 * @returns {boolean}                                   Whether the entry should be rendered in the context menu.
 */

/**
 * @callback ContextMenuCallback
 * @param {HTMLElement} target                          The element that the context menu has been triggered for.
 * @returns {unknown}
 */

/**
 * @callback ContextMenuJQueryCallback
 * @param {HTMLElement|jQuery} target                   The element that the context menu has been triggered for. Will
 *                                                      either be a jQuery object or an HTMLElement instance, depending
 *                                                      on how the ContextMenu was configured.
 * @returns {unknown}
 */

/**
 * @typedef ContextMenuOptions
 * @property {string} [eventName="contextmenu"] Optionally override the triggering event which can spawn the menu. If
 *                                              the menu is using fixed positioning, this event must be a MouseEvent.
 * @property {ContextMenuCallback} [onOpen]     A function to call when the context menu is opened.
 * @property {ContextMenuCallback} [onClose]    A function to call when the context menu is closed.
 * @property {boolean} [fixed=false]            If true, the context menu is given a fixed position rather than being
 *                                              injected into the target.
 * @property {boolean} [jQuery=true]            If true, callbacks will be passed jQuery objects instead of HTMLElement
 *                                              instances.
 */

/**
 * @typedef ContextMenuRenderOptions
 * @property {Event} [event]           The event that triggered the context menu opening.
 * @property {boolean} [animate=true]  Animate the context menu opening.
 */

/**
 * A subclass of ContextMenu.
 * @extends {foundry.applications.ux.ContextMenu}
 */
export default class DHContextMenu extends foundry.applications.ux.ContextMenu {
    /**
     * @param {HTMLElement|jQuery} container - The HTML element that contains the context menu targets.
     * @param {string} selector - A CSS selector which activates the context menu.
     * @param {ContextMenuEntry[]} menuItems - An Array of entries to display in the menu
     * @param {ContextMenuOptions} [options] - Additional options to configure the context menu.
     */
    constructor(container, selector, menuItems, options) {
        super(container, selector, menuItems, options);

        /** @deprecated since v13 until v15 */
        this.#jQuery = options.jQuery;
    }

    /**
     * Whether to pass jQuery objects or HTMLElement instances to callback.
     * @type {boolean}
     */
    #jQuery;

    /**@inheritdoc */
    activateListeners(menu) {
        menu.addEventListener('click', this.#onClickItem.bind(this));
    }

    /**
     * Handle click events on context menu items.
     * @param {PointerEvent} event      The click event
     */
    #onClickItem(event) {
        event.preventDefault();
        event.stopPropagation();
        const element = event.target.closest('.context-item');
        if (!element) return;
        const item = this.menuItems.find(i => i.element === element);
        item?.callback(this.#jQuery ? $(this.target) : this.target, event);
        this.close();
    }

    /* -------------------------------------------- */

    /**
     * Trigger a context menu event in response to a normal click on a additional options button.
     * @param {PointerEvent} event
     */
    static triggerContextMenu(event) {
        event.preventDefault();
        event.stopPropagation();
        const { clientX, clientY } = event;
        const selector = '[data-item-uuid]';
        const target = event.target.closest(selector) ?? event.currentTarget.closest(selector);
        target?.dispatchEvent(
            new PointerEvent('contextmenu', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX,
                clientY
            })
        );
    }
}
