const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class ActiveEffectPathViewer extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        classes: ['daggerheart', 'dialog', 'dh-style', 'active-effect-change-paths-dialog'],
        position: {
            width: 612,
            height: 800
        },
        window: {
            icon: 'fa-solid fa-scroll',
            title: 'DAGGERHEART.APPLICATIONS.ActiveEffectPathViewer.title'
        }
    };

    /** @override */
    static PARTS = {
        main: {
            template: 'systems/daggerheart/templates/dialogs/activeEffectPathViewer.hbs',
            scrollable: ['.paths-container']
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.paths = game.system.api.applications.sheetConfigs.ActiveEffectConfig.getChangeChoices();

        return context;
    }
}
