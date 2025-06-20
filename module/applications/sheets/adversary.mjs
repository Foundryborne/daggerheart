import DaggerheartSheet from './daggerheart-sheet.mjs';

const { ActorSheetV2 } = foundry.applications.sheets;
export default class AdversarySheet extends DaggerheartSheet(ActorSheetV2) {
    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'sheet', 'actor', 'dh-style', 'adversary'],
        position: { width: 450, height: 1000 },
        actions: {
            reactionRoll: this.reactionRoll,
            attackRoll: this.attackRoll,
            addExperience: this.addExperience,
            removeExperience: this.removeExperience,
            toggleHP: this.toggleHP,
            toggleStress: this.toggleStress
        },
        form: {
            handler: this.updateForm,
            submitOnChange: true,
            closeOnSubmit: false
        }
    };

    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/actors/adversary/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        main: { template: 'systems/daggerheart/templates/sheets/actors/adversary/main.hbs' },
        information: { template: 'systems/daggerheart/templates/sheets/actors/adversary/information.hbs' }
    };

    static TABS = {
        main: {
            active: true,
            cssClass: '',
            group: 'primary',
            id: 'main',
            icon: null,
            label: 'DAGGERHEART.Sheets.Adversary.Tabs.Main'
        },
        information: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'information',
            icon: null,
            label: 'DAGGERHEART.Sheets.Adversary.Tabs.Information'
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

    static async reactionRoll(event) {
        const config = {
            event: event,
            title: `${this.actor.name} - Reaction Roll`,
            roll: {
                modifier: null,
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

    static async attackRoll(event) {
        const { modifier, damage, name: attackName } = this.actor.system.attack,
            config = {
                event: event,
                title: attackName,
                roll: {
                    modifier: modifier,
                    type: 'action'
                },
                chatMessage: {
                    type: 'adversaryRoll',
                    template: 'systems/daggerheart/templates/chat/adversary-attack-roll.hbs'
                },
                damage: {
                    value: damage.value,
                    type: damage.type
                },
                checkTarget: true
            };
        this.actor.diceRoll(config);
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
