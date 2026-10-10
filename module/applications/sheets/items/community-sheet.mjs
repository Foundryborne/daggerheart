import DHHeritageSheet from '../api/heritage-sheet.mjs';

/** @import { DHCommunity } from '../../../data/item/_module.mjs'; */

/** @extends {DHHeritageSheet<DhItem<DHCommunity>>} */
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
            template: 'systems/daggerheart/templates/sheets/items/community/features.hbs',
            scrollable: ['.feature']
        }
    };

    /**@inheritdoc */
    get relatedDocs() {
        return this.document.system.features;
    }
}
