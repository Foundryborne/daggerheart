import DHHeritageSheet from '../api/heritage-sheet.mjs';

export default class CommunitySheet extends DHHeritageSheet {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['community']
    };

    /**@inheritdoc */
    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/items/community/header.hbs' },
        ...super.PARTS,
        features: {
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-features.hbs',
            scrollable: ['.feature']
        }
    };
}
