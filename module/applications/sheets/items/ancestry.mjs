import DHHeritageSheet from '../api/heritage-sheet.mjs';

export default class AncestrySheet extends DHHeritageSheet {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['ancestry']
    };

    /**@inheritdoc */
    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/items/ancestry/header.hbs' },
        ...super.PARTS,
        features: { template: 'systems/daggerheart/templates/sheets/items/ancestry/features.hbs' }
    };

    /**@inheritdoc */
    get relatedDocs() {
        return this.document.system.features.map(x => x.item);
    }

    /* -------------------------------------------- */
    /*  Application Drag/Drop                       */
    /* -------------------------------------------- */

    /**
     * On drop on the item.
     * @param {DragEvent} event - The drag event
     */
    async _onDrop(event) {
        const data = TextEditor.getDragEventData(event);
        if (data.type === 'ActiveEffect') return super._onDrop(event);

        const target = event.target.closest('fieldset.drop-section');
        const typeField =
            this.document.system[target.dataset.type === 'primary' ? 'primaryFeature' : 'secondaryFeature'];

        if (!typeField) {
            super._onDrop(event);
        }
    }
}
