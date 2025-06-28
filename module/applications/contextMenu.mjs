export default class DhContextMenu extends ContextMenu {
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
}
