export default class DhSceneConfigSettings extends foundry.applications.sheets.SceneConfig {
    constructor(options, ...args) {
        super(options, ...args);
    }

    static buildParts() {
        const { footer, ...parts } = super.PARTS;
        const tmpParts = {
            ...parts,
            dh: { template: 'systems/daggerheart/templates/scene/dh-config.hbs' },
            footer
        };
        return tmpParts;
    }

    static PARTS = DhSceneConfigSettings.buildParts();

    static buildTabs() {
        super.TABS.sheet.tabs.push({ id: 'dh', icon: 'fa-solid' });
        return super.TABS;
    }

    static TABS = DhSceneConfigSettings.buildTabs();
}
