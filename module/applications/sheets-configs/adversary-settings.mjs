const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DHAdversarySettings extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(actor) {
        super({});

        this.actor = actor;
        this._dragDrop = this._createDragDropHandlers();
    }

    get title() {
        return `${game.i18n.localize('DAGGERHEART.Sheets.TABS.settings')}`;
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'dh-style', 'dialog', 'adversary-settings'],
        window: {
            icon: 'fa-solid fa-wrench',
            resizable: false
        },
        position: { width: 455, height: 'auto' },
        actions: {
            addExperience: this.#addExperience,
            removeExperience: this.#removeExperience,
            addFeature: this.#addFeature,
            editFeature: this.#editFeature,
            removeFeature: this.#removeFeature
        },
        form: {
            handler: this.updateForm,
            submitOnChange: true,
            closeOnSubmit: false
        },
        dragDrop: [
            { dragSelector: null, dropSelector: '.tab.features' },
            { dragSelector: '.feature-item', dropSelector: null }
        ]
    };

    static PARTS = {
        header: {
            id: 'header',
            template: 'systems/daggerheart/templates/sheets-settings/adversary-settings/header.hbs'
        },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        details: {
            id: 'details',
            template: 'systems/daggerheart/templates/sheets-settings/adversary-settings/details.hbs'
        },
        attack: {
            id: 'attack',
            template: 'systems/daggerheart/templates/sheets-settings/adversary-settings/attack.hbs'
        },
        experiences: {
            id: 'experiences',
            template: 'systems/daggerheart/templates/sheets-settings/adversary-settings/experiences.hbs'
        },
        features: {
            id: 'features',
            template: 'systems/daggerheart/templates/sheets-settings/adversary-settings/features.hbs'
        }
    };

    static TABS = {
        details: {
            active: true,
            cssClass: '',
            group: 'primary',
            id: 'details',
            icon: null,
            label: 'DAGGERHEART.General.tabs.details'
        },
        attack: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'attack',
            icon: null,
            label: 'DAGGERHEART.General.tabs.attack'
        },
        experiences: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'experiences',
            icon: null,
            label: 'DAGGERHEART.General.tabs.experiences'
        },
        features: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'features',
            icon: null,
            label: 'DAGGERHEART.General.tabs.features'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.document = this.actor;
        context.tabs = this._getTabs(this.constructor.TABS);
        context.systemFields = this.actor.system.schema.fields;
        context.systemFields.attack.fields = this.actor.system.attack.schema.fields;
        context.isNPC = true;

        return context;
    }

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        this._dragDrop.forEach(d => d.bind(htmlElement));
    }

    _createDragDropHandlers() {
        return this.options.dragDrop.map(d => {
            d.callbacks = {
                dragstart: this._onDragStart.bind(this),
                drop: this._onDrop.bind(this)
            };
            return new foundry.applications.ux.DragDrop.implementation(d);
        });
    }

    _getTabs(tabs) {
        for (const v of Object.values(tabs)) {
            v.active = this.tabGroups[v.group] ? this.tabGroups[v.group] === v.id : v.active;
            v.cssClass = v.active ? 'active' : '';
        }

        return tabs;
    }

    static async #addExperience() {
        const newExperience = {
            name: 'Experience',
            modifier: 0
        };
        await this.actor.update({ [`system.experiences.${foundry.utils.randomID()}`]: newExperience });
        this.render();
    }

    static async #removeExperience(_, target) {
        await this.actor.update({ [`system.experiences.-=${target.dataset.experience}`]: null });
        this.render();
    }

    static async #addFeature(_, _button) {
        await this.actor.createEmbeddedDocuments('Item', [
            {
                type: 'feature',
                name: game.i18n.format('DOCUMENT.New', { type: game.i18n.localize('TYPES.Item.feature') }),
                img: 'icons/skills/melee/weapons-crossed-swords-black.webp'
            }
        ]);
        this.render();
    }

    static async #editFeature(event, target) {
        event.stopPropagation();
        this.actor.items.get(target.id).sheet.render(true);
    }

    static async #removeFeature(event, target) {
        event.stopPropagation();
        await this.actor.deleteEmbeddedDocuments('Item', [target.id]);
        this.render();
    }

    static async updateForm(event, _, formData) {
        await this.actor.update(formData.object);
        this.render();
    }

    async _onDragStart(event) {
        const featureItem = event.currentTarget.closest('.feature-item');

        if (featureItem) {
            const feature = this.actor.items.get(featureItem.id);
            const featureData = { type: 'Item', uuid: feature.uuid, fromInternal: true };
            event.dataTransfer.setData('text/plain', JSON.stringify(featureData));
            event.dataTransfer.setDragImage(featureItem.querySelector('img'), 60, 0);
        }
    }

    async _onDrop(event) {
        const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
        if (data.fromInternal) return;

        const item = await fromUuid(data.uuid);
        if (item.type === 'feature') {
            await this.actor.createEmbeddedDocuments('Item', [item]);
            this.render();
        }
    }
}
