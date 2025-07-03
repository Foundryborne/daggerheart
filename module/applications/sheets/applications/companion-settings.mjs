import { GMUpdateEvent, socketEvent } from '../../../helpers/socket.mjs';
import DhCompanionlevelUp from '../../levelup/companionLevelup.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DHCompanionSettings extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(actor) {
        super({});

        this.actor = actor;
    }

    get title() {
        return `${game.i18n.localize('DAGGERHEART.Sheets.TABS.settings')}`;
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'dh-style', 'dialog', 'companion-settings'],
        window: {
            icon: 'fa-solid fa-wrench',
            resizable: false
        },
        position: { width: 455, height: 'auto' },
        actions: {
            levelUp: this.levelUp
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
            template: 'systems/daggerheart/templates/sheets/applications/companion-settings/header.hbs'
        },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        details: {
            id: 'details',
            template: 'systems/daggerheart/templates/sheets/applications/companion-settings/details.hbs'
        },
        experiences: {
            id: 'experiences',
            template: 'systems/daggerheart/templates/sheets/applications/companion-settings/experiences.hbs'
        },
        attack: {
            id: 'attack',
            template: 'systems/daggerheart/templates/sheets/applications/companion-settings/attack.hbs'
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
        experiences: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'experiences',
            icon: null,
            label: 'DAGGERHEART.General.tabs.experiences'
        },
        attack: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'attack',
            icon: null,
            label: 'DAGGERHEART.General.tabs.attack'
        }
    };

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        htmlElement.querySelector('.partner-value')?.addEventListener('change', this.onPartnerChange.bind(this));
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.document = this.actor;
        context.tabs = this._getTabs(this.constructor.TABS);
        context.systemFields = this.actor.system.schema.fields;
        context.systemFields.attack.fields = this.actor.system.attack.schema.fields;
        context.isNPC = true;
        context.playerCharacters = game.actors
            .filter(
                x =>
                    x.type === 'character' &&
                    (x.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER) ||
                        this.document.system.partner?.uuid === x.uuid)
            )
            .map(x => ({ key: x.uuid, name: x.name }));

        return context;
    }

    _getTabs(tabs) {
        for (const v of Object.values(tabs)) {
            v.active = this.tabGroups[v.group] ? this.tabGroups[v.group] === v.id : v.active;
            v.cssClass = v.active ? 'active' : '';
        }

        return tabs;
    }

    async onPartnerChange(event) {
        const partnerDocument = event.target.value
            ? await foundry.utils.fromUuid(event.target.value)
            : this.actor.system.partner;
        const partnerUpdate = { 'system.companion': event.target.value ? this.actor.uuid : null };

        if (!partnerDocument.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)) {
            await game.socket.emit(`system.${SYSTEM.id}`, {
                action: socketEvent.GMUpdate,
                data: {
                    action: GMUpdateEvent.UpdateDocument,
                    uuid: partnerDocument.uuid,
                    update: update
                }
            });
        } else {
            await partnerDocument.update(partnerUpdate);
        }

        await this.actor.update({ 'system.partner': event.target.value });

        if (!event.target.value) {
            await this.actor.updateLevel(1);
        }

        this.render();
    }

    async viewActor(_, button) {
        const target = button.closest('[data-item-uuid]');
        const actor = await foundry.utils.fromUuid(target.dataset.itemUuid);
        if (!actor) return;

        actor.sheet.render(true);
    }

    static async levelUp() {
        new DhCompanionlevelUp(this.actor).render(true);
    }

    static async updateForm(event, _, formData) {
        await this.actor.update(formData.object);
        this.render();
    }
}
