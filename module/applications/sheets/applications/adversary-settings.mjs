import DHActionConfig from '../../config/Action.mjs';
import DHBaseItemSheet from '../api/base-item.mjs';
import { actionsTypes } from '../../../data/_module.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DHAdversarySettings extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(actor) {
        super({});

        this.actor = actor;
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
            addAction: this.#addAction,
            editAction: this.#editAction,
            removeAction: this.#removeAction
        },
        form: {
            handler: this.updateForm,
            submitOnChange: true,
            closeOnSubmit: false
        }
    };

    static PARTS = {
        header: {
            id: 'header',
            template: 'systems/daggerheart/templates/sheets/applications/adversary-settings/header.hbs'
        },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        details: {
            id: 'details',
            template: 'systems/daggerheart/templates/sheets/applications/adversary-settings/details.hbs'
        },
        attack: {
            id: 'attack',
            template: 'systems/daggerheart/templates/sheets/applications/adversary-settings/attack.hbs'
        },
        experiences: {
            id: 'experiences',
            template: 'systems/daggerheart/templates/sheets/applications/adversary-settings/experiences.hbs'
        },
        actions: {
            id: 'actions',
            template: 'systems/daggerheart/templates/sheets/applications/adversary-settings/actions.hbs'
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
        actions: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'actions',
            icon: null,
            label: 'DAGGERHEART.General.tabs.actions'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.document = this.actor;
        context.tabs = this._getTabs(this.constructor.TABS);
        context.systemFields = this.actor.system.schema.fields;
        context.systemFields.attack.fields = this.actor.system.attack.schema.fields;
        context.isNPC = true;
        console.log(context)

        return context;
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

    static async updateForm(event, _, formData) {
        await this.actor.update(formData.object);
        this.render();
    }
}
