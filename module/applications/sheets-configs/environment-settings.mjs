const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DHEnvironmentSettings extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(actor) {
        super({});

        this.actor = actor;
        this._dragDrop = this._createDragDropHandlers();
    }

    get title() {
        return `${game.i18n.localize('DAGGERHEART.GENERAL.Tabs.settings')}`;
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'dh-style', 'dialog', 'environment-settings'],
        window: {
            icon: 'fa-solid fa-wrench',
            resizable: false
        },
        position: { width: 455, height: 'auto' },
        actions: {
            addFeature: this.#addFeature,
            editFeature: this.#editFeature,
            removeFeature: this.#removeFeature,
            addCategory: this.#addCategory,
            deleteProperty: this.#deleteProperty,
            viewAdversary: this.#viewAdversary,
            deleteAdversary: this.#deleteAdversary
        },
        form: {
            handler: this.updateForm,
            submitOnChange: true,
            closeOnSubmit: false
        },
        dragDrop: [
            { dragSelector: null, dropSelector: '.category-container' },
            { dragSelector: null, dropSelector: '.tab.features' },
            { dragSelector: '.feature-item', dropSelector: null }
        ]
    };

    static PARTS = {
        header: {
            id: 'header',
            template: 'systems/daggerheart/templates/sheets-settings/environment-settings/header.hbs'
        },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        details: {
            id: 'details',
            template: 'systems/daggerheart/templates/sheets-settings/environment-settings/details.hbs'
        },
        features: {
            id: 'features',
            template: 'systems/daggerheart/templates/sheets-settings/environment-settings/features.hbs'
        },
        adversaries: {
            id: 'adversaries',
            template: 'systems/daggerheart/templates/sheets-settings/environment-settings/adversaries.hbs'
        }
    };

    static TABS = {
        details: {
            active: true,
            cssClass: '',
            group: 'primary',
            id: 'details',
            icon: null,
            label: 'DAGGERHEART.GENERAL.Tabs.details'
        },
        features: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'features',
            icon: null,
            label: 'DAGGERHEART.GENERAL.Tabs.features'
        },
        adversaries: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'adversaries',
            icon: null,
            label: 'DAGGERHEART.GENERAL.Tabs.adversaries'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.document = this.actor;
        context.tabs = this._getTabs(this.constructor.TABS);
        context.systemFields = this.actor.system.schema.fields;
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

    static async #addFeature(_, _button) {
        await this.actor.createEmbeddedDocuments('Item', [
            {
                type: 'feature',
                name: game.i18n.format('DOCUMENT.New', { type: game.i18n.localize('TYPES.Item.feature') }),
                img: 'icons/magic/perception/orb-crystal-ball-scrying-blue.webp'
            }
        ]);
        this.render();
    }

    static async #editFeature(_, target) {
        this.actor.items.get(target.id).sheet.render(true);
    }

    static async #removeFeature(_, target) {
        await this.actor.deleteEmbeddedDocuments('Item', [target.id]);
        this.render();
    }

    static async #addCategory() {
        await this.actor.update({
            [`system.potentialAdversaries.${foundry.utils.randomID()}.label`]: game.i18n.localize(
                'DAGGERHEART.ACTORS.Environment.newAdversary'
            )
        });
        this.render();
    }

    static async #deleteProperty(_, target) {
        await this.actor.update({ [`${target.dataset.path}.-=${target.id}`]: null });
        this.render();
    }

    static async #viewAdversary(_, button) {
        const adversary = await foundry.utils.fromUuid(button.dataset.adversary);
        if (!adversary) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.adversaryMissing'));
            return;
        }

        adversary.sheet.render(true);
    }

    static async #deleteAdversary(event, target) {
        const adversaryKey = target.dataset.adversary;
        const path = `system.potentialAdversaries.${target.dataset.potentialAdversary}.adversaries`;
        const newAdversaries = foundry.utils
            .getProperty(this.actor, path)
            .filter(x => x && (x?.uuid ?? x) !== adversaryKey);
        await this.actor.update({ [path]: newAdversaries });
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
        if (item.type === 'adversary' && event.target.closest('.category-container')) {
            const target = event.target.closest('.category-container');
            const path = `system.potentialAdversaries.${target.dataset.potentialAdversary}.adversaries`;
            const current = foundry.utils.getProperty(this.actor, path).map(x => x.uuid);
            await this.actor.update({
                [path]: [...current, item.uuid]
            });
            this.render();
        } else if (item.type === 'feature' && event.target.closest('.tab.features')) {
            await this.actor.createEmbeddedDocuments('Item', [item]);
            this.render();
        }
    }

    static async updateForm(event, _, formData) {
        await this.actor.update(formData.object);
        this.render();
    }
}
