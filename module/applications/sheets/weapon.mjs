// import DhpApplicationMixin from '../daggerheart-sheet.mjs';

// export default class WeaponSheet extends DhpApplicationMixin(ItemSheet) {
//     static documentType = "weapon";

//     /** @override */
//     static get defaultOptions() {
//         return foundry.utils.mergeObject(super.defaultOptions, {
//             classes: ["daggerheart", "sheet", "weapon"],
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
export default class WeaponSheet extends DaggerheartSheet(ItemSheetV2) {
    static DEFAULT_OPTIONS = {
        tag: 'form',
        id: 'daggerheart-weapon',
        classes: ['daggerheart', 'sheet', 'weapon'],
        position: { width: 400 },
        form: {
            handler: this.updateForm,
            submitOnChange: true,
            closeOnSubmit: false
        }
    };

    static PARTS = {
        form: {
            id: 'feature',
            template: 'systems/daggerheart/templates/sheets/weapon.hbs'
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
