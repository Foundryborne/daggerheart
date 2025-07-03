import DaggerheartSheet from '../daggerheart-sheet.mjs';
import DHCompanionSettings from '../applications/companion-settings.mjs';

const { ActorSheetV2 } = foundry.applications.sheets;
export default class DhCompanionSheet extends DaggerheartSheet(ActorSheetV2) {
    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'sheet', 'actor', 'dh-style', 'companion'],
        position: { width: 300 },
        actions: {
            viewActor: this.viewActor,
            openSettings: this.openSettings,
            useItem: this.useItem,
            toChat: this.toChat
        },
        form: {
            handler: this.updateForm,
            submitOnChange: true,
            closeOnSubmit: false
        }
    };

    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/actors/companion/header.hbs' },
        details: { template: 'systems/daggerheart/templates/sheets/actors/companion/details.hbs' },
        effects: { template: 'systems/daggerheart/templates/sheets/actors/companion/effects.hbs' }
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
        effects: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'effects',
            icon: null,
            label: 'DAGGERHEART.Sheets.PC.Tabs.effects'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.document = this.document;
        context.tabs = super._getTabs(this.constructor.TABS);

        return context;
    }

    static async updateForm(event, _, formData) {
        await this.document.update(formData.object);
        this.render();
    }

    static async viewActor(_, button) {
        const target = button.closest('[data-item-uuid]');
        const actor = await foundry.utils.fromUuid(target.dataset.itemUuid);
        if (!actor) return;

        actor.sheet.render(true);
    }

    getAction(element) {
        const itemId = (element.target ?? element).closest('[data-item-id]').dataset.itemId,
            item = this.document.system.actions.find(x => x.id === itemId);
        return item;
    }

    static async useItem(event) {
        const action = this.getAction(event) ?? this.actor.system.attack;
        action.use(event);
    }

    static async toChat(event, button) {
        if (button?.dataset?.type === 'experience') {
            const experience = this.document.system.experiences[button.dataset.uuid];
            const cls = getDocumentClass('ChatMessage');
            const systemData = {
                name: game.i18n.localize('DAGGERHEART.General.Experience.Single'),
                description: `${experience.name} ${experience.total < 0 ? experience.total : `+${experience.total}`}`
            };
            const msg = new cls({
                type: 'abilityUse',
                user: game.user.id,
                system: systemData,
                content: await foundry.applications.handlebars.renderTemplate(
                    'systems/daggerheart/templates/chat/ability-use.hbs',
                    systemData
                )
            });

            cls.create(msg.toObject());
        } else {
            const item = this.getAction(event) ?? this.document.system.attack;
            item.toChat(this.document.id);
        }
    }

    static async openSettings() {
        await new DHCompanionSettings(this.document).render(true);
    }
}
