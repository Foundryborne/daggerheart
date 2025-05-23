// import DhpApplicationMixin from '../daggerheart-sheet.mjs';

// export default class AncestrySheet extends DhpApplicationMixin(ItemSheet) {
//     static documentType = "ancestry";

//     constructor(options){
//         super(options);
//     }

//     /** @override */
//     static get defaultOptions() {
//         return foundry.utils.mergeObject(super.defaultOptions, {
//             classes: ["daggerheart", "sheet", "heritage"],
//             width: 600,
//             height: 'auto',
//             dragDrop: [{ dragSelector: null, dropSelector: null }],
//         });
//     }

//     /** @override */
//     getData() {
//         const context = super.getData();

//         return context;
//     }

//     async _handleAction(action, event, button) {
//         switch(action){
//             case 'editAbility':
//                 this.editAbility(button);
//                 break;
//             case 'deleteAbility':
//                 this.deleteAbility(event);
//                 break;
//         }
//     }

//     async editAbility(button){
//         const feature = await fromUuid(button.dataset.ability);
//         feature.sheet.render(true);
//     }

//     async deleteAbility(event){
//         event.preventDefault();
//         event.stopPropagation();
//         await this.item.update({ "system.abilities": this.item.system.abilities.filter(x => x.uuid !== event.currentTarget.dataset.ability) })
//     }

//     async _onDrop(event) {
//         const data = TextEditor.getDragEventData(event);
//         const item = await fromUuid(data.uuid);
//         if(item.type === 'feature' && item.system.type === SYSTEM.ITEM.featureTypes.ancestry.id) {
//             await this.object.update({ "system.abilities": [...this.item.system.abilities, { img: item.img, name: item.name, uuid: item.uuid }] });
//         }
//     }
// }

import DaggerheartSheet from './daggerheart-sheet.mjs';

const { ItemSheetV2 } = foundry.applications.sheets;
export default class AncestrySheet extends DaggerheartSheet(ItemSheetV2) {
    static DEFAULT_OPTIONS = {
        tag: 'form',
        id: 'daggerheart-ancestry',
        classes: ['daggerheart', 'sheet', 'heritage'],
        position: { width: 600 },
        actions: {
            editAbility: this.editAbility,
            deleteAbility: this.deleteAbility
        },
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
            template: 'systems/daggerheart/templates/sheets/ancestry.hbs'
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

    static async editAbility(_, button) {
        const feature = await fromUuid(button.dataset.ability);
        feature.sheet.render(true);
    }

    static async deleteAbility(event, button) {
        event.preventDefault();
        event.stopPropagation();
        await this.item.update({
            'system.abilities': this.item.system.abilities.filter(x => x.uuid !== button.dataset.ability)
        });
    }

    async _onDrop(event) {
        const data = TextEditor.getDragEventData(event);
        const item = await fromUuid(data.uuid);
        if (item.type === 'feature' && item.system.type === SYSTEM.ITEM.featureTypes.ancestry.id) {
            await this.document.update({
                'system.abilities': [
                    ...this.document.system.abilities,
                    { img: item.img, name: item.name, uuid: item.uuid }
                ]
            });
        }
    }
}
