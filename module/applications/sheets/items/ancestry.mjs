import DHHeritageSheetV2 from './heritage.mjs';

const { ItemSheetV2 } = foundry.applications.sheets;
export default class AncestrySheet extends DHHeritageSheetV2(ItemSheetV2) {
    static DEFAULT_OPTIONS = {
        classes: ['ancestry']
    };

    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/items/ancestry/header.hbs' },
        ...super.PARTS
    };
}
