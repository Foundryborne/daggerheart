export default class DhSettings extends foundry.applications.sidebar.tabs.Settings {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ['dh-sidebar-settings']
    }

    /** @inheritDoc */
    async _onRender(context, options) {
        await super._onRender(context, options);

        const infoSection = this.element?.querySelector('.info');
        if (!infoSection) return;

        infoSection.querySelector('.system')?.remove();

        const element = await foundry.applications.handlebars.renderTemplate(
            'systems/daggerheart/templates/sidebar/settings/info-insert.hbs',
            { version: game.system.version }
        );
        infoSection.insertAdjacentHTML('afterend', element);
    }
}