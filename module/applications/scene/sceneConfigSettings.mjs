export default class DhSceneConfigSettings extends foundry.applications.sheets.SceneConfig {
    // static DEFAULT_OPTIONS = {
    //     ...super.DEFAULT_OPTIONS,
    //     form: {
    //         handler: this.updateData,
    //         closeOnSubmit: true
    //     }
    // };

    static buildParts() {
        const { footer, tabs, ...parts } = super.PARTS;
        const tmpParts = {
            // tabs,
            tabs: { template: 'systems/daggerheart/templates/scene/tabs.hbs' },
            ...parts,
            dh: { template: 'systems/daggerheart/templates/scene/dh-config.hbs' },
            footer
        };
        return tmpParts;
    }

    static PARTS = DhSceneConfigSettings.buildParts();

    static buildTabs() {
        super.TABS.sheet.tabs.push({ id: 'dh', src: 'systems/daggerheart/assets/logos/FoundryBorneLogoWhite.svg' });
        return super.TABS;
    }

    static TABS = DhSceneConfigSettings.buildTabs();

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);
        switch (partId) {
            case 'dh':
                htmlElement.querySelector('#rangeMeasurementSetting')?.addEventListener('change', async event => {
                    const flagData = foundry.utils.mergeObject(this.document.flags.daggerheart, {
                        rangeMeasurement: { setting: event.target.value }
                    });
                    this.document.flags.daggerheart = flagData;
                    this.render();
                });
                break;
        }
    }

    /** @inheritDoc */
    async _preparePartContext(partId, context, options) {
        context = await super._preparePartContext(partId, context, options);
        switch (partId) {
            case 'dh':
                context.data = new game.system.api.data.scenes.DHScene(canvas.scene.flags.daggerheart);
                context.variantRules = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.variantRules);
                break;
        }

        return context;
    }

    // static async updateData(event, _, formData) {
    //     const data = foundry.utils.expandObject(formData.object);
    //     this.close(data);
    // }
}
