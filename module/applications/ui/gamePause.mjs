export default class DhGamePause extends foundry.applications.ui.GamePause {
    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.spin = false;
        context.icon = 'systems/daggerheart/assets/logos/compatible_with_DH_logos-10.png';

        return context;
    }
}