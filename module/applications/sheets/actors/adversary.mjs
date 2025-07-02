import DHActionConfig from '../../config/Action.mjs';
import DaggerheartSheet from '../daggerheart-sheet.mjs';
import DHAdversarySettings from '../applications/adversary-settings.mjs';

const { ActorSheetV2 } = foundry.applications.sheets;
export default class AdversarySheet extends DaggerheartSheet(ActorSheetV2) {
    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'sheet', 'actor', 'dh-style', 'adversary'],
        position: { width: 660, height: 766 },
        actions: {
            reactionRoll: this.reactionRoll,
            useItem: this.useItem,
            toChat: this.toChat,
            attackConfigure: this.attackConfigure,
            addExperience: this.addExperience,
            removeExperience: this.removeExperience,
            toggleHP: this.toggleHP,
            toggleStress: this.toggleStress,
            openSettings: this.openSettings
        },
        form: {
            handler: this.updateForm,
            submitOnChange: true,
            closeOnSubmit: false
        }
    };

    static PARTS = {
        sidebar: { template: 'systems/daggerheart/templates/sheets/actors/adversary/sidebar.hbs' },
        header: { template: 'systems/daggerheart/templates/sheets/actors/adversary/header.hbs' },
        actions: { template: 'systems/daggerheart/templates/sheets/actors/adversary/actions.hbs' },
        notes: { template: 'systems/daggerheart/templates/sheets/actors/adversary/notes.hbs' },
        effects: { template: 'systems/daggerheart/templates/sheets/actors/adversary/effects.hbs' }
    };

    static TABS = {
        actions: {
            active: true,
            cssClass: '',
            group: 'primary',
            id: 'actions',
            icon: null,
            label: 'DAGGERHEART.General.tabs.actions'
        },
        notes: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'notes',
            icon: null,
            label: 'DAGGERHEART.Sheets.Adversary.Tabs.notes'
        },
        effects: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'effects',
            icon: null,
            label: 'DAGGERHEART.Sheets.Adversary.Tabs.effects'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.document = this.document;
        context.tabs = super._getTabs(this.constructor.TABS);
        context.systemFields.attack.fields = this.document.system.attack.schema.fields;
        context.getEffectDetails = this.getEffectDetails.bind(this);
        context.isNPC = true;
        return context;
    }

    getAction(element) {
        const itemId = (element.target ?? element).closest('[data-item-id]').dataset.itemId,
            item = this.document.system.actions.find(x => x.id === itemId);
        return item;
    }

    static async updateForm(event, _, formData) {
        await this.document.update(formData.object);
        this.render();
    }

    static async reactionRoll(event) {
        const config = {
            event: event,
            title: `${this.actor.name} - Reaction Roll`,
            roll: {
                // modifier: null,
                type: 'reaction'
            },
            chatMessage: {
                type: 'adversaryRoll',
                template: 'systems/daggerheart/templates/chat/adversary-roll.hbs',
                mute: true
            }
        };
        this.actor.diceRoll(config);
    }

    getEffectDetails(id) {
        return {};
    }

    static async openSettings() {
        await new DHAdversarySettings(this.document).render(true);
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
                description: `${experience.name} ${
                    experience.modifier < 0 ? experience.modifier : `+${experience.modifier}`
                }`
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

    static async attackConfigure(event) {
        await new DHActionConfig(this.document.system.attack).render(true);
    }

    static async addExperience() {
        const experienceId = foundry.utils.randomID();
        await this.document.update({
            [`system.experiences.${experienceId}`]: { id: experienceId, name: 'Experience', value: 1 }
        });
    }

    static async removeExperience(_, button) {
        await this.document.update({
            [`system.experiences.-=${button.dataset.experience}`]: null
        });
    }

    static async toggleHP(_, button) {
        const index = Number.parseInt(button.dataset.index);
        const newHP = index < this.document.system.resources.health.value ? index : index + 1;
        await this.document.update({ 'system.resources.health.value': newHP });
    }

    static async toggleStress(_, button) {
        const index = Number.parseInt(button.dataset.index);
        const newStress = index < this.document.system.resources.stress.value ? index : index + 1;
        await this.document.update({ 'system.resources.stress.value': newStress });
    }
}
