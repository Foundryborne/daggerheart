import DHBaseItemSheet from '../api/base-item.mjs';

export default class BeastformSheet extends DHBaseItemSheet {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['beastform']
    };

    /**@override */
    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/items/beastform/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        settings: { template: 'systems/daggerheart/templates/sheets/items/beastform/settings.hbs' },
        features: {
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-features.hbs',
            scrollable: ['.features']
        },
        effects: {
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-effects.hbs',
            scrollable: ['.effects']
        }
    };

    static TABS = {
        primary: {
            tabs: [{ id: 'settings' }, { id: 'features' }, { id: 'effects' }],
            initial: 'settings',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };
}
