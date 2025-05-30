import DaggerheartSheet from '../daggerheart-sheet.mjs';

const { ItemSheetV2 } = foundry.applications.sheets;
const { TextEditor } = foundry.applications.ux;
const { duplicate, getProperty } = foundry.utils;
export default class SubclassSheet extends DaggerheartSheet(ItemSheetV2) {
    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'sheet', 'item', 'dh-style', 'subclass'],
        position: { width: 600 },
        window: { resizable: false },
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

    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/items/subclass/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        description: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-description.hbs' },
        features: {
            template: 'systems/daggerheart/templates/sheets/items/subclass/features.hbs',
            scrollable: ['.features']
        },
        settings: {
            template: 'systems/daggerheart/templates/sheets/items/subclass/settings.hbs',
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
        features: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'features',
            icon: null,
            label: 'DAGGERHEART.Sheets.Feature.Tabs.Features'
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
        context.config = CONFIG.daggerheart;
        context.tabs = super._getTabs(this.constructor.TABS);

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
        event.preventDefault();
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
        const featureData = { name: item.name, img: item.img, uuid: item.uuid };
        abilities.push(featureData);

        await this.document.update({ [path]: abilities });
    }
}
