import DHActionConfig from '../../config/Action.mjs';
import DHBaseItemSheet from '../api/base-item.mjs';
import { actionsTypes } from '../../../data/_module.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DHEnvironmentSettings extends HandlebarsApplicationMixin(ApplicationV2) {
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
        classes: ['daggerheart', 'dh-style', 'dialog', 'environment-settings'],
        window: {
            icon: 'fa-solid fa-wrench',
            resizable: false
        },
        position: { width: 455, height: 'auto' },
        actions: {
            addAction: this.#addAction,
            editAction: this.#editAction,
            removeAction: this.#removeAction,
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
        dragDrop: [{ dragSelector: null, dropSelector: '.category-container' }]
    };

    static PARTS = {
        header: {
            id: 'header',
            template: 'systems/daggerheart/templates/sheets/applications/environment-settings/header.hbs'
        },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        details: {
            id: 'details',
            template: 'systems/daggerheart/templates/sheets/applications/environment-settings/details.hbs'
        },
        actions: {
            id: 'actions',
            template: 'systems/daggerheart/templates/sheets/applications/environment-settings/actions.hbs'
        },
        adversaries: {
            id: 'adversaries',
            template: 'systems/daggerheart/templates/sheets/applications/environment-settings/adversaries.hbs'
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
        actions: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'actions',
            icon: null,
            label: 'DAGGERHEART.General.tabs.actions'
        },
        adversaries: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'adversaries',
            icon: null,
            label: 'DAGGERHEART.General.tabs.adversaries'
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

    static async #addAction(_event, _button) {
        const actionType = await DHBaseItemSheet.selectActionType();
        if (!actionType) return;
        try {
            const cls = actionsTypes[actionType] ?? actionsTypes.attack,
                action = new cls(
                    {
                        _id: foundry.utils.randomID(),
                        type: actionType,
                        name: game.i18n.localize(SYSTEM.ACTIONS.actionTypes[actionType].name),
                        ...cls.getSourceConfig(this.actor)
                    },
                    {
                        parent: this.actor
                    }
                );
            await this.actor.update({ 'system.actions': [...this.actor.system.actions, action] });
            await new DHActionConfig(this.actor.system.actions[this.actor.system.actions.length - 1]).render({
                force: true
            });
            this.render();
        } catch (error) {
            console.log(error);
        }
    }

    static async #editAction(event, target) {
        event.stopPropagation();
        const actionIndex = target.dataset.index;
        await new DHActionConfig(this.actor.system.actions[actionIndex]).render({
            force: true
        });
    }

    static async #removeAction(event, target) {
        event.stopPropagation();
        const actionIndex = target.dataset.index;
        await this.actor.update({
            'system.actions': this.actor.system.actions.filter((_, index) => index !== Number.parseInt(actionIndex))
        });
        this.render();
    }

    static async #addCategory() {
        await this.actor.update({
            [`system.potentialAdversaries.${foundry.utils.randomID()}.label`]: game.i18n.localize(
                'DAGGERHEART.Sheets.Environment.newAdversary'
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
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.notifications.adversaryMissing'));
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

    async _onDrop(event) {
        const data = TextEditor.getDragEventData(event);
        const item = await fromUuid(data.uuid);
        if (item.type === 'adversary') {
            const target = event.target.closest('.category-container');
            const path = `system.potentialAdversaries.${target.dataset.potentialAdversary}.adversaries`;
            const current = foundry.utils.getProperty(this.actor, path).map(x => x.uuid);
            await this.actor.update({
                [path]: [...current, item.uuid]
            });
            this.render();
        }
    }

    static async updateForm(event, _, formData) {
        await this.actor.update(formData.object);
        this.render();
    }
}
