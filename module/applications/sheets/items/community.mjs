import DHHeritageSheetV2 from './heritage.mjs';

const { ItemSheetV2 } = foundry.applications.sheets;
export default class CommunitySheet extends DHHeritageSheetV2(ItemSheetV2) {
    static DEFAULT_OPTIONS = {
        classes: ['community']
    };

    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/items/community/header.hbs' },
        ...super.PARTS
    };
}
