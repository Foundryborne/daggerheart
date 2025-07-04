export default class DhContextMenu extends foundry.applications.ux.ContextMenu.implementation {
    constructor(container, selector, menuItems, options) {
        super(container, selector, menuItems, options);

        /** @deprecated since v13 until v15 */
        this.#jQuery = options.jQuery;
    }

    #jQuery;

    activateListeners(menu) {
        menu.addEventListener('click', this.#onClickItem.bind(this));
    }

    #onClickItem(event) {
        event.preventDefault();
        event.stopPropagation();
        const element = event.target.closest('.context-item');
        if (!element) return;
        const item = this.menuItems.find(i => i.element === element);
        item?.callback(this.#jQuery ? $(this.target) : this.target, event);
        this.close();
    }

    static triggerContextMenu(event) {
        event.preventDefault();
        event.stopPropagation();
        const { clientX, clientY } = event;
        const selector = '[data-item-id]';
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
