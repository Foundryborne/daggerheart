import DHItemSheetV2 from '../item.mjs';

const { ItemSheetV2 } = foundry.applications.sheets;
export default class ArmorSheet extends DHItemSheetV2(ItemSheetV2) {
    static DEFAULT_OPTIONS = {
        classes: ['armor'],
        dragDrop: [{ dragSelector: null, dropSelector: null }]
    };

    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/items/armor/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        description: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-description.hbs' },
        actions: {
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-actions.hbs',
            scrollable: ['.actions']
        },
        settings: {
            template: 'systems/daggerheart/templates/sheets/items/armor/settings.hbs',
            scrollable: ['.settings']
        }
    };
}
