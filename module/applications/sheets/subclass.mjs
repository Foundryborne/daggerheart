// import DhpApplicationMixin from '../daggerheart-sheet.mjs';

// export default class SubclassSheet extends DhpApplicationMixin(ItemSheet) {
//     static documentType = "subclass";

//     constructor(options){
//         super(options);
//     }

//     static get defaultOptions() {
//         return foundry.utils.mergeObject(super.defaultOptions, {
//             classes: ["daggerheart", "sheet", "subclass"],
//             width: 600,
//             height: 720,
//             tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "general" }],
//             dragDrop: [
//                 { dragSelector: null, dropSelector: '.foundation-tab' },
//                 { dragSelector: null, dropSelector: '.specialization-tab' },
//                 { dragSelector: null, dropSelector: '.mastery-tab' }
//             ],
//         });
//     }

//     getData() {
//         const context = super.getData();
//         context.config = CONFIG.daggerheart;

//         return context;
//     }

//     async _handleAction(action, event, button) {
//         switch(action){
//             case "editAbility":
//                 this.editAbility(button);
//                 break;
//             case "deleteFeatureAbility":
//                 this.deleteFeatureAbility(event);
//                 break;
//         }
//     }

//     async editAbility(button){
//         const feature = await fromUuid(button.dataset.ability);
//         feature.sheet.render(true);
//     }

//     async deleteFeatureAbility(event){
//         event.preventDefault();
//         event.stopPropagation();

//         const feature = event.currentTarget.dataset.feature;
//         const newAbilities = this.item.system[`${feature}Feature`].abilities.filter(x => x.uuid !== event.currentTarget.dataset.ability);
//         const path = `system.${feature}Feature.abilities`;

//         await this.item.update({ [path]: newAbilities });
//     }

//     async _onDrop(event) {
//         const data = TextEditor.getDragEventData(event);
//         const item = await fromUuid(data.uuid);
//         if(item.type === 'feature' && item.system.type === SYSTEM.ITEM.featureTypes.subclass.id) {
//             if(event.currentTarget.classList.contains('foundation-tab')){
//                 await this.object.update({ "system.foundationFeature.abilities": [...this.item.system.foundationFeature.abilities, { img: item.img, name: item.name, uuid: item.uuid }] });
//             }
//             else if(event.currentTarget.classList.contains('specialization-tab')){
//                 await this.object.update({ "system.specializationFeature.abilities": [...this.item.system.specializationFeature.abilities, { img: item.img, name: item.name, uuid: item.uuid }] });
//             }
//             else if(event.currentTarget.classList.contains('mastery-tab')){
//                 await this.object.update({ "system.masteryFeature.abilities": [...this.item.system.masteryFeature.abilities, { img: item.img, name: item.name, uuid: item.uuid }] });
//             }
//         }
//     }
// }

import DaggerheartSheet from './daggerheart-sheet.mjs';
import DaggerheartFeature from '../../data/feature.mjs';

const { ItemSheetV2 } = foundry.applications.sheets;
const { TextEditor } = foundry.applications.ux;
const { duplicate, getProperty } = foundry.utils;
export default class SubclassSheet extends DaggerheartSheet(ItemSheetV2) {
    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'sheet', 'subclass'],
        position: { width: 600, height: 600 },
        window: { resizable: true },
        actions: {
            editAbility: this.editAbility,
            deleteFeatureAbility: this.deleteFeatureAbility
        },
        form: {
            handler: this.updateForm,
            submitOnChange: true,
            closeOnSubmit: false
        },
        dragDrop: [
            { dragSelector: null, dropSelector: '.foundation-tab' },
            { dragSelector: null, dropSelector: '.specialization-tab' },
            { dragSelector: null, dropSelector: '.mastery-tab' }
        ]
    };

    _getTabs() {
        const tabs = {
            general: {
                active: true,
                cssClass: '',
                group: 'primary',
                id: 'general',
                icon: null,
                label: game.i18n.localize('DAGGERHEART.Sheets.Subclass.Tabs.General')
            },
            foundation: {
                active: false,
                cssClass: '',
                group: 'primary',
                id: 'foundation',
                icon: null,
                label: game.i18n.localize('DAGGERHEART.Sheets.Subclass.Tabs.Foundation')
            },
            specialization: {
                active: false,
                cssClass: '',
                group: 'primary',
                id: 'specialization',
                icon: null,
                label: game.i18n.localize('DAGGERHEART.Sheets.Subclass.Tabs.Specialization')
            },
            mastery: {
                active: false,
                cssClass: '',
                group: 'primary',
                id: 'mastery',
                icon: null,
                label: game.i18n.localize('DAGGERHEART.Sheets.Subclass.Tabs.Mastery')
            }
        };
        for (const v of Object.values(tabs)) {
            v.active = this.tabGroups[v.group] ? this.tabGroups[v.group] === v.id : v.active;
            v.cssClass = v.active ? 'active' : '';
        }

        return tabs;
    }

    static PARTS = {
        form: {
            id: 'feature',
            template: 'systems/daggerheart/templates/sheets/subclass.hbs'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.document = this.document;
        context.config = CONFIG.daggerheart;
        context.tabs = this._getTabs();

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

    static async deleteFeatureAbility(event, button) {
        event.preventDefault();
        event.stopPropagation();

        const feature = button.dataset.feature;
        const newAbilities = this.document.system[`${feature}Feature`].abilities.filter(
            x => x.uuid !== button.dataset.ability
        );
        const path = `system.${feature}Feature.abilities`;

        await this.document.update({ [path]: newAbilities });
    }

    async _onDrop(event) {
        event.preventDefault()
        const data = TextEditor.getDragEventData(event);
        const item = await fromUuid(data.uuid);
        if (!(item.type === 'feature' && item.system.type === SYSTEM.ITEM.featureTypes.subclass.id)) return;

        let featureField;
        if (event.currentTarget.classList.contains('foundation-tab')) featureField = 'foundation';
        else if (event.currentTarget.classList.contains('specialization-tab')) featureField = 'specialization';
        else if (event.currentTarget.classList.contains('mastery-tab')) featureField = 'mastery';
        else return;

        const path = `system.${featureField}Feature.abilities`;
        const abilities = duplicate(getProperty(this.document, path)) || [];
        const featureData = {name: item.name, img: item.img, uuid: item.uuid };
        abilities.push(featureData);

        await this.document.update({ [path]: abilities });
    }
}
