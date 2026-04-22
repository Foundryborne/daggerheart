export default class DHContextMenu extends foundry.applications.ux.ContextMenu {
    /**
     * Trigger a context menu event in response to a normal click on a additional options button.
     * @param {PointerEvent} event
     */
    static triggerContextMenu(event, altSelector) {
        event.preventDefault();
        event.stopPropagation();

        const selector = altSelector ?? '[data-item-uuid]';
        if (ui.context?.selector === selector) return;

        const { clientX, clientY } = event;
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
