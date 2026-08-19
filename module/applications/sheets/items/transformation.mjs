import DHBaseItemSheet from '../api/base-item.mjs';

export default class TransformationSheet extends DHBaseItemSheet {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        position: { width: 450, height: 700 },
        classes: ['transformation']
    };

    /**@override */
    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/items/transformation/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        description: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-description.hbs' },
        features: { 
            template: 'systems/daggerheart/templates/sheets/items/transformation/features.hbs',
            scrollable: ['']
        }
    };

    /** @override*/
    static TABS = {
        primary: {
            tabs: [{ id: 'description' }, { id: 'features' }],
            initial: 'description',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
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
    // async _onDrop(event) {
    //     const data = TextEditor.getDragEventData(event);
    //     if (data.type === 'ActiveEffect') return super._onDrop(event);

    //     const target = event.target.closest('fieldset.drop-section');
    //     if (target) {
    //         const typeField =
    //             this.document.system[target.dataset.type === 'primary' ? 'primaryFeature' : 'secondaryFeature'];
    //         if (!typeField) {
    //             super._onDrop(event);
    //         }
    //     }
    // }
}