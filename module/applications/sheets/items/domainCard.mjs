import DHItemSheetV2 from '../item.mjs';

const { ItemSheetV2 } = foundry.applications.sheets;
export default class DomainCardSheet extends DHItemSheetV2(ItemSheetV2) {
    static DEFAULT_OPTIONS = {
        classes: ['domain-card'],
        position: { width: 450, height: 700 }
    };

    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/items/domainCard/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        description: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-description.hbs' },
        actions: {
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-actions.hbs',
            scrollable: ['.actions']
        },
        settings: {
            template: 'systems/daggerheart/templates/sheets/items/domainCard/settings.hbs',
            scrollable: ['.settings']
        }
    };
}
