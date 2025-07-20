import DHBaseItemSheet from '../api/base-item.mjs';
import Tagify from '@yaireo/tagify';

export default class BeastformSheet extends DHBaseItemSheet {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['beastform']
    };

    /**@override */
    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/items/beastform/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        settings: { template: 'systems/daggerheart/templates/sheets/items/beastform/settings.hbs' },
        features: {
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-features.hbs',
            scrollable: ['.features']
        },
        advanced: { template: 'systems/daggerheart/templates/sheets/items/beastform/advanced.hbs' },
        effects: {
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-effects.hbs',
            scrollable: ['.effects']
        }
    };

    static TABS = {
        primary: {
            tabs: [{ id: 'settings' }, { id: 'features' }, { id: 'advanced' }, { id: 'effects' }],
            initial: 'settings',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        const advantageOnInput = htmlElement.querySelector('.advantageon-input');
        if (advantageOnInput) {
            const tagifyElement = new Tagify(advantageOnInput, {
                tagTextProp: 'name',
                templates: {
                    tag(tagData) {
                        return `<tag
                                    contenteditable='false'
                                    spellcheck='false'
                                    tabIndex="${this.settings.a11y.focusableTags ? 0 : -1}"
                                    class="${this.settings.classNames.tag} ${tagData.class ? tagData.class : ''}"
                                    ${this.getAttributes(tagData)}> 
                            <x class="${this.settings.classNames.tagX}" role='button' aria-label='remove tag'></x>
                            <div>
                                <span class="${this.settings.classNames.tagText}">${tagData[this.settings.tagTextProp] || tagData.value}</span>
                                ${tagData.src ? `<img src="${tagData.src}"></i>` : ''}
                            </div>
                        </tag>`;
                    }
                }
            });
            tagifyElement.on('add', this.advantageOnAdd.bind(this));
            tagifyElement.on('remove', this.advantageOnRemove.bind(this));
        }
    }

    /**@inheritdoc */
    async _preparePartContext(partId, context, options) {
        await super._preparePartContext(partId, context, options);

        switch (partId) {
            case 'settings':
                context.advantageOn = JSON.stringify(
                    Object.keys(context.document.system.advantageOn).map(key => ({
                        value: key,
                        name: context.document.system.advantageOn[key].value
                    }))
                );
                break;
            case 'effects':
                context.effects.actives = context.effects.actives.map(effect => {
                    const data = effect.toObject();
                    data.id = effect.id;
                    if (effect.type === 'beastform') data.mandatory = true;

                    return data;
                });
                break;
        }

        return context;
    }

    async advantageOnAdd(event) {
        await this.document.update({
            [`system.advantageOn.${foundry.utils.randomID()}`]: { value: event.detail.data.value }
        });
    }

    async advantageOnRemove(event) {
        await this.document.update({
            [`system.advantageOn.-=${event.detail.data.value}`]: null
        });
    }
}
