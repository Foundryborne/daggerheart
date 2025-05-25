// import DhpApplicationMixin from '../daggerheart-sheet.mjs';

// export default class ArmorSheet extends DhpApplicationMixin(ItemSheet) {
//     static documentType = "armor";

//     /** @override */
//     static get defaultOptions() {
//         return foundry.utils.mergeObject(super.defaultOptions, {
//             classes: ["daggerheart", "sheet", "armor"],
//             width: 400,
//             height: 'auto',
//         });
//     }

//     /** @override */
//     getData() {
//         const context = super.getData();
//         context.config = CONFIG.daggerheart;

//         return context;
//     }

//     async _handleAction(action, event, button) {
//         switch(action){
//         }
//     }
// }
import DaggerheartSheet from './daggerheart-sheet.mjs';

const { ItemSheetV2 } = foundry.applications.sheets;
export default class ArmorSheet extends DaggerheartSheet(ItemSheetV2) {
    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'sheet', 'armor'],
        position: { width: 400 },
        form: {
            handler: this.updateForm,
            submitOnChange: true,
            closeOnSubmit: false
        },
        dragDrop: [{ dragSelector: null, dropSelector: null }]
    };

    static PARTS = {
        form: {
            id: 'feature',
            template: 'systems/daggerheart/templates/sheets/armor.hbs'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.document = this.document;
        context.config = CONFIG.daggerheart;

        return context;
    }

    static async updateForm(event, _, formData) {
        await this.document.update(formData.object);
        this.render();
    }
}
