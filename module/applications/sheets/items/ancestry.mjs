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
        features: { 
            template: 'systems/daggerheart/templates/sheets/items/ancestry/features.hbs',
            scrollable: ['']
        }
    };

    /**@inheritdoc */
    get relatedDocs() {
        return this.document.system.features.map(x => x.item);
    }

    /** @inheritdoc */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        // There can only be one primary/secondary but we show all in case something errors so the user can delete it.
        const features = this.item.system.features;
        context.primaryFeatures = features.filter(x => x.type === CONFIG.DH.ITEM.featureSubTypes.primary);
        context.secondaryFeatures = features.filter(x => x.type !== CONFIG.DH.ITEM.featureSubTypes.primary);
        return context;
    }

    /* -------------------------------------------- */
    /*  Application Drag/Drop                       */
    /* -------------------------------------------- */

    /**
     * On drop on the item.
     * @param {DragEvent} event - The drag event
     */
    async _onDrop(event) {
        const TextEditor = foundry.applications.ux.TextEditor;
        const data = TextEditor.getDragEventData(event);
        if (data.type === 'ActiveEffect') return super._onDrop(event);

        const target = event.target.closest('fieldset.drop-section');
        if (target) {
            const type = CONFIG.DH.ITEM.featureSubTypes[target.dataset.type];
            const exists = this.document.system.features.some(f => f.type === type);
            if (!exists) super._onDrop(event);
        }
    }
}
