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

        const systemUpdate = game.user.isGM && game.data.systemUpdate.hasUpdate
            ? _loc('SETUP.UpdateAvailable', {
                type: _loc('PACKAGE.Type.system'),
                channel: game.data.system.title,
                version: game.data.systemUpdate.version
            })
            : null;

        const element = await foundry.applications.handlebars.renderTemplate(
            'systems/daggerheart/templates/sidebar/settings/info-insert.hbs',
            { version: game.system.version, systemUpdate }
        );
        infoSection.insertAdjacentHTML('afterend', element);
    }
}