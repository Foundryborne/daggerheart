// import DhpApplicationMixin from '../daggerheart-sheet.mjs';

// export default class ConsumableSheet extends DhpApplicationMixin(ItemSheet) {
//     static documentType = "consumable";

//     /** @override */
//     static get defaultOptions() {
//         return foundry.utils.mergeObject(super.defaultOptions, {
//             classes: ["daggerheart", "sheet", "consumable"],
//             width: 480,
//             height: 'auto',
//         });
//     }

//     /** @override */
//     getData() {
//         const context = super.getData();

//         return context;
//     }
// }

import DaggerheartSheet from './daggerheart-sheet.mjs';

const { ItemSheetV2 } = foundry.applications.sheets;
export default class ConsumableSheet extends DaggerheartSheet(ItemSheetV2) {
    static DEFAULT_OPTIONS = {
        tag: 'form',
        id: 'daggerheart-consumable',
        classes: ['daggerheart', 'sheet', 'consumable'],
        position: { width: 480 },
        form: {
            handler: this.updateForm,
            submitOnChange: true,
            closeOnSubmit: false
        }
    };

    static PARTS = {
        form: {
            id: 'feature',
            template: 'systems/daggerheart/templates/sheets/consumable.hbs'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.document = this.document;

        return context;
    }

    static async updateForm(event, _, formData) {
        await this.document.update(formData.object);
        this.render();
    }
}
