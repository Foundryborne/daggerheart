// import DhpApplicationMixin from '../daggerheart-sheet.mjs';

// export default class MiscellaneousSheet extends DhpApplicationMixin(ItemSheet) {
//     static documentType = "miscellaneous";

//     /** @override */
//     static get defaultOptions() {
//         return foundry.utils.mergeObject(super.defaultOptions, {
//             classes: ["daggerheart", "sheet", "miscellaneous"],
//             width: 400,
//             height: 'auto',
//         });
//     }

//     /** @override */
//     getData() {
//         const context = super.getData();

//         return context;
//     }
// }

import DaggerheartSheet from '../daggerheart-sheet.mjs';

const { ItemSheetV2 } = foundry.applications.sheets;
export default class MiscellaneousSheet extends DaggerheartSheet(ItemSheetV2) {
    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'sheet', 'dh-style', 'miscellaneous'],
        position: { width: 550 },
        form: {
            handler: this.updateForm,
            submitOnChange: true,
            closeOnSubmit: false
        }
    };

    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/items/miscellaneous/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        description: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-description.hbs' },
        settings: {
            template: 'systems/daggerheart/templates/sheets/items/miscellaneous/settings.hbs',
            scrollable: ['.settings']
        }
    };

    static TABS = {
        description: {
            active: true,
            cssClass: '',
            group: 'primary',
            id: 'description',
            icon: null,
            label: 'DAGGERHEART.Sheets.Feature.Tabs.Description'
        },
        settings: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'settings',
            icon: null,
            label: 'DAGGERHEART.Sheets.Feature.Tabs.Settings'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.document = this.document;
        context.tabs = super._getTabs(this.constructor.TABS);

        return context;
    }

    static async updateForm(event, _, formData) {
        await this.document.update(formData.object);
        this.render();
    }
}
