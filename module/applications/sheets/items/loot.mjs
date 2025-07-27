import DHBaseItemSheet from '../api/base-item.mjs';

export default class LootSheet extends DHBaseItemSheet {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['loot'],
        position: { width: 550 }
    };

    /**@override */
    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/items/loot/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        description: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-description.hbs' },
        actions: {
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-actions.hbs',
            scrollable: ['.actions']
        },
        settings: {
            template: 'systems/daggerheart/templates/sheets/items/loot/settings.hbs',
            scrollable: ['.settings']
        },
        effects: {
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-effects.hbs',
            scrollable: ['.effects']
        }
    };
}
