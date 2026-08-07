export default class DhFolderConfig extends foundry.applications.sheets.FolderConfig {
    /** @override */
    static PARTS = {
        body: {template: 'systems/daggerheart/templates/sheets-settings/folder-config/folder-config.hbs'},
        footer: {template: 'templates/generic/form-footer.hbs'}
    };

    async _onRender(context, options) {
        super._onRender(context, options);
    }
    
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.usesDefaultEntity = ['Actor', 'Item'].includes(context.document.type);
        context.defaultEntity = this.document.getDefaultEntity({ withInheritance: false });
        context.defaultEntityOptions = Object.keys(CONFIG[context.document.type].dataModels ?? {}).map(model => ({
            value: model,
            label: _loc(`TYPES.${context.document.type}.${model}`)
        }));
        context.entityTypeName = _loc(`DOCUMENT.${context.document.type}`);

        return context;
    }
}