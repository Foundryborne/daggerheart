import DaggerheartSheet from '../daggerheart-sheet.mjs';
import Tagify from '@yaireo/tagify';

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
            removeFeature: this.removeFeature,
            viewFeature: this.viewFeature,
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
        const domainTagify = new Tagify(domainInput, {
            tagTextProp: 'name',
            enforceWhitelist: true,
            whitelist: Object.keys(SYSTEM.DOMAIN.domains).map(key => {
                const domain = SYSTEM.DOMAIN.domains[key];
                return {
                    value: key,
                    name: game.i18n.localize(domain.label),
                    src: domain.src,
                    background: domain.background
                };
            }),
            maxTags: 2,
            callbacks: { invalid: this.onAddTag },
            dropdown: {
                mapValueTo: 'name',
                searchKeys: ['name'],
                enabled: 0,
                maxItems: 20,
                closeOnSelect: true,
                highlightFirst: false
            },
            templates: {
                tag(tagData) {
                    //z-index: unset; background-image: ${tagData.background}; Maybe a domain specific background for the chips?
                    return `<tag title="${tagData.title || tagData.value}"
                        contenteditable='false'
                        spellcheck='false'
                        tabIndex="${this.settings.a11y.focusableTags ? 0 : -1}"
                        class="${this.settings.classNames.tag} ${tagData.class ? tagData.class : ''}"
                        ${this.getAttributes(tagData)}> 
                <x class="${this.settings.classNames.tagX}" role='button' aria-label='remove tag'></x>
                <div>
                    <span class="${this.settings.classNames.tagText}">${tagData[this.settings.tagTextProp] || tagData.value}</span>
                    <img src="${tagData.src}"></i>
                </div>
              </tag>`;
                }
            }
        });

        domainTagify.on('change', this.onDomainSelect.bind(this));
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.document = this.document;
        context.tabs = super._getTabs(this.constructor.TABS);
        context.domains = this.document.system.domains.map(x => SYSTEM.DOMAIN.domains[x].label);

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

    async onDomainSelect(event) {
        const domains = event.detail?.value ? JSON.parse(event.detail.value) : [];
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

    static async removeFeature(_, button) {
        await this.document.update({
            'system.features': this.document.system.features.filter(x => x.uuid !== button.dataset.feature)
        });
    }

    static async viewFeature(_, button) {
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

    async _onDrop(event) {
        const data = TextEditor.getDragEventData(event);
        const item = await fromUuid(data.uuid);
        if (item.type === 'subclass') {
            await this.document.update({
                'system.subclasses': [
                    ...this.document.system.subclasses,
                    { img: item.img, name: item.name, uuid: item.uuid }
                ]
            });
        } else if (item.type === 'feature') {
            await this.document.update({
                'system.features': [
                    ...this.document.system.features,
                    { img: item.img, name: item.name, uuid: item.uuid }
                ]
            });
        } else if (item.type === 'weapon') {
            if (event.currentTarget.classList.contains('primary-weapon-section')) {
                if (!this.document.system.characterGuide.suggestedPrimaryWeapon && !item.system.secondary)
                    await this.document.update({
                        'system.characterGuide.suggestedPrimaryWeapon': {
                            img: item.img,
                            name: item.name,
                            uuid: item.uuid
                        }
                    });
            } else if (event.currentTarget.classList.contains('secondary-weapon-section')) {
                if (!this.document.system.characterGuide.suggestedSecondaryWeapon && item.system.secondary)
                    await this.document.update({
                        'system.characterGuide.suggestedSecondaryWeapon': {
                            img: item.img,
                            name: item.name,
                            uuid: item.uuid
                        }
                    });
            }
        } else if (item.type === 'armor') {
            if (event.currentTarget.classList.contains('armor-section')) {
                if (!this.document.system.characterGuide.suggestedArmor)
                    await this.document.update({
                        'system.characterGuide.suggestedArmor': { img: item.img, name: item.name, uuid: item.uuid }
                    });
            }
        } else if (event.currentTarget.classList.contains('choice-a-section')) {
            if (item.type === 'miscellaneous' || item.type === 'consumable') {
                if (this.document.system.inventory.choiceA.length < 2)
                    await this.document.update({
                        'system.inventory.choiceA': [
                            ...this.document.system.inventory.choiceA,
                            { img: item.img, name: item.name, uuid: item.uuid }
                        ]
                    });
            }
        } else if (item.type === 'miscellaneous') {
            if (event.currentTarget.classList.contains('take-section')) {
                if (this.document.system.inventory.take.length < 3)
                    await this.document.update({
                        'system.inventory.take': [
                            ...this.document.system.inventory.take,
                            { img: item.img, name: item.name, uuid: item.uuid }
                        ]
                    });
            } else if (event.currentTarget.classList.contains('choice-b-section')) {
                if (this.document.system.inventory.choiceB.length < 2)
                    await this.document.update({
                        'system.inventory.choiceB': [
                            ...this.document.system.inventory.choiceB,
                            { img: item.img, name: item.name, uuid: item.uuid }
                        ]
                    });
            }
        }
    }
}
