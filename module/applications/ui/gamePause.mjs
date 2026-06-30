export default class DhGamePause extends foundry.applications.ui.GamePause {
    async _onRender(context, options) {
        await super._onRender(context, options);
    
        /* Avoid altering the styling if a module has subscribed to the renderGamePause hook  */
        if (!Hooks.events.renderGamePause?.length) {
            this.element.classList.add('dh-style');
        }
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        /* Avoid altering the gamepause context if a module has subscribed to the renderGamePause hook  */
        if (!Hooks.events.renderGamePause?.length) {
            context.spin = options.spin ?? false;
            context.icon = options.icon ?? 'systems/daggerheart/assets/logos/compatible_with_DH_logos-10.png';
        }

        return context;
    }
}