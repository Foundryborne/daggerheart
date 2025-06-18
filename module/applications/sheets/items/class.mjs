import { actionsTypes } from '../../../data/_module.mjs';
import { tagifyElement } from '../../../helpers/utils.mjs';
import DHActionConfig from '../../config/Action.mjs';
import DaggerheartSheet from '../daggerheart-sheet.mjs';

const { ItemSheetV2 } = foundry.applications.sheets;
const { TextEditor } = foundry.applications.ux;

export default class ClassSheet extends DaggerheartSheet(ItemSheetV2) {
    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'sheet', 'item', 'dh-style', 'class'],
        position: { width: 700 },
        actions: {
            removeSubclass: this.removeSubclass,
            viewSubclass: this.viewSubclass,
            addFeature: this.addFeature,
            editFeature: this.editFeature,
            deleteFeature: this.deleteFeature,
            removeItem: this.removeItem,
            viewItem: this.viewItem,
            removePrimaryWeapon: this.removePrimaryWeapon,
            removeSecondaryWeapon: this.removeSecondaryWeapon,
            removeArmor: this.removeArmor
        },
        form: {
            handler: this.updateForm,
            submitOnChange: true,
            closeOnSubmit: false
        },
        dragDrop: [
            { dragSelector: '.suggested-item', dropSelector: null },
            { dragSelector: null, dropSelector: '.take-section' },
            { dragSelector: null, dropSelector: '.choice-a-section' },
            { dragSelector: null, dropSelector: '.choice-b-section' },
            { dragSelector: null, dropSelector: '.primary-weapon-section' },
            { dragSelector: null, dropSelector: '.secondary-weapon-section' },
            { dragSelector: null, dropSelector: '.armor-section' },
            { dragSelector: null, dropSelector: null }
        ]
    };

    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/items/class/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        features: {
            template: 'systems/daggerheart/templates/sheets/items/class/features.hbs',
            scrollable: ['.features']
        },
        settings: {
            template: 'systems/daggerheart/templates/sheets/items/class/settings.hbs',
            scrollable: ['.settings']
        }
    };

    static TABS = {
        features: {
            active: true,
            cssClass: '',
            group: 'primary',
            id: 'features',
            icon: null,
            label: 'DAGGERHEART.Sheets.Class.Tabs.Features'
        },
        settings: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'settings',
            icon: null,
            label: 'DAGGERHEART.Sheets.Class.Tabs.settings'
        }
    };

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        const domainInput = htmlElement.querySelector('.domain-input');
        tagifyElement(domainInput, SYSTEM.DOMAIN.domains, this.onDomainSelect.bind(this));
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.document = this.document;
        context.tabs = super._getTabs(this.constructor.TABS);
        context.domains = this.document.system.domains;

        return context;
    }

    static async updateForm(event, _, formData) {
        await this.document.update(formData.object);
        this.render();
    }

    onAddTag(e) {
        if (e.detail.index === 2) {
            ui.notifications.info(game.i18n.localize('DAGGERHEART.Notification.Info.ClassCanOnlyHaveTwoDomains'));
        }
    }

    async onDomainSelect(domains) {
        await this.document.update({ 'system.domains': domains.map(x => x.value) });
        this.render(true);
    }

    static async removeSubclass(_, button) {
        await this.document.update({
            'system.subclasses': this.document.system.subclasses.filter(x => x.uuid !== button.dataset.subclass)
        });
    }

    static async viewSubclass(_, button) {
        const subclass = await fromUuid(button.dataset.subclass);
        subclass.sheet.render(true);
    }

    static async deleteFeature(_, button) {
        await this.document.update({
            'system.features': this.document.system.features.map(x => x.uuid).filter(x => x !== button.dataset.feature)
        });
    }

    static async editFeature(_, button) {
        const feature = await fromUuid(button.dataset.feature);
        feature.sheet.render(true);
    }

    static async removeItem(event, button) {
        event.stopPropagation();
        const type = button.dataset.type;
        const path = `system.inventory.${type}`;
        await this.document.update({
            [path]: this.document.system.inventory[type].filter(x => x.uuid !== button.dataset.item)
        });
    }

    static async viewItem(_, button) {
        const item = await fromUuid(button.dataset.item);
        item.sheet.render(true);
    }

    static async removePrimaryWeapon(event) {
        event.stopPropagation();
        await this.document.update({ 'system.characterGuide.suggestedPrimaryWeapon': null }, { diff: false });
    }

    static async removeSecondaryWeapon(event) {
        event.stopPropagation();
        await this.document.update({ 'system.characterGuide.suggestedSecondaryWeapon': null }, { diff: false });
    }

    static async removeArmor(event) {
        event.stopPropagation();
        await this.document.update({ 'system.characterGuide.suggestedArmor': null }, { diff: false });
    }

    async selectActionType() {
        const content = await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/views/actionType.hbs',
                { types: SYSTEM.ACTIONS.actionTypes }
            ),
            title = 'Select Action Type',
            type = 'form',
            data = {};
        return Dialog.prompt({
            title,
            label: title,
            content,
            type,
            callback: html => {
                const form = html[0].querySelector('form'),
                    fd = new foundry.applications.ux.FormDataExtended(form);
                foundry.utils.mergeObject(data, fd.object, { inplace: true });

                return data;
            },
            rejectClose: false
        });
    }

    getActionPath(type) {
        return type === 'hope' ? 'hopeFeatures' : 'classFeatures';
    }

    static async addFeature(_, target) {
        const actionPath = this.getActionPath(target.dataset.type);
        const actionType = await this.selectActionType();
        const cls = actionsTypes[actionType?.type] ?? actionsTypes.attack,
            action = new cls(
                {
                    _id: foundry.utils.randomID(),
                    systemPath: actionPath,
                    type: actionType.type,
                    name: game.i18n.localize(SYSTEM.ACTIONS.actionTypes[actionType.type].name),
                    ...cls.getSourceConfig(this.document)
                },
                {
                    parent: this.document
                }
            );
        await this.document.update({ [`system.${actionPath}`]: [...this.document.system[actionPath], action] });
    }

    static async editFeature(_, target) {
        const action = this.document.system[this.getActionPath(target.dataset.type)].find(
            x => x._id === target.dataset.feature
        );
        await new DHActionConfig(action).render(true);
    }

    static async deleteFeature(_, target) {
        const actionPath = this.getActionPath(target.dataset.type);
        await this.document.update({
            [`system.${actionPath}`]: this.document.system[actionPath].filter(
                action => action._id !== target.dataset.feature
            )
        });
    }

    async _onDrop(event) {
        const data = TextEditor.getDragEventData(event);
        const item = await fromUuid(data.uuid);
        const target = event.target.closest('fieldset.drop-section');
        if (item.type === 'subclass') {
            await this.document.update({
                'system.subclasses': [...this.document.system.subclasses.map(x => x.uuid), item.uuid]
            });
        } else if (item.type === 'weapon') {
            if (target.classList.contains('primary-weapon-section')) {
                if (!this.document.system.characterGuide.suggestedPrimaryWeapon && !item.system.secondary)
                    await this.document.update({
                        'system.characterGuide.suggestedPrimaryWeapon': item.uuid
                    });
            } else if (target.classList.contains('secondary-weapon-section')) {
                if (!this.document.system.characterGuide.suggestedSecondaryWeapon && item.system.secondary)
                    await this.document.update({
                        'system.characterGuide.suggestedSecondaryWeapon': item.uuid
                    });
            }
        } else if (item.type === 'armor') {
            if (target.classList.contains('armor-section')) {
                if (!this.document.system.characterGuide.suggestedArmor)
                    await this.document.update({
                        'system.characterGuide.suggestedArmor': item.uuid
                    });
            }
        } else if (target.classList.contains('choice-a-section')) {
            if (item.type === 'miscellaneous' || item.type === 'consumable') {
                if (this.document.system.inventory.choiceA.length < 2)
                    await this.document.update({
                        'system.inventory.choiceA': [
                            ...this.document.system.inventory.choiceA.map(x => x.uuid),
                            item.uuid
                        ]
                    });
            }
        } else if (item.type === 'miscellaneous') {
            if (target.classList.contains('take-section')) {
                if (this.document.system.inventory.take.length < 3)
                    await this.document.update({
                        'system.inventory.take': [...this.document.system.inventory.take.map(x => x.uuid), item.uuid]
                    });
            } else if (target.classList.contains('choice-b-section')) {
                if (this.document.system.inventory.choiceB.length < 2)
                    await this.document.update({
                        'system.inventory.choiceB': [
                            ...this.document.system.inventory.choiceB.map(x => x.uuid),
                            item.uuid
                        ]
                    });
            }
        }
    }
}
