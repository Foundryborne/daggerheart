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
        const { roll, diceResults, modifiers } = await this.actor.diceRoll(
            { title: `${this.actor.name} - Reaction Roll`, value: 0 },
            event.shiftKey
        );

        const cls = getDocumentClass('ChatMessage');
        const systemData = {
            roll: roll._formula,
            total: roll._total,
            modifiers: modifiers,
            diceResults: diceResults
        };
        const msg = new cls({
            type: 'adversaryRoll',
            system: systemData,
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/chat/adversary-roll.hbs',
                systemData
            ),
            rolls: [roll]
        });

        cls.create(msg.toObject());
    }

    static async attackRoll() {
        const { modifier, damage, name: attackName } = this.actor.system.attack;
        const { roll, dice, advantageState, modifiers } = await this.actor.diceRoll(
            { title: `${this.actor.name} - Attack Roll`, value: modifier },
            event.shiftKey
        );

        const targets = Array.from(game.user.targets).map(x => ({
            id: x.id,
            name: x.actor.name,
            img: x.actor.img,
            difficulty: x.actor.system.difficulty,
            evasion: x.actor.system.evasion
        }));

        const cls = getDocumentClass('ChatMessage');
        const systemData = {
            title: attackName,
            origin: this.document.id,
            roll: roll._formula,
            advantageState,
            total: roll._total,
            modifiers: modifiers,
            dice: dice,
            targets: targets,
            damage: { value: damage.value, type: damage.type }
        };
        const msg = new cls({
            type: 'adversaryRoll',
            sound: CONFIG.sounds.dice,
            system: systemData,
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/chat/adversary-attack-roll.hbs',
                systemData
            ),
            rolls: [roll]
        });

        cls.create(msg.toObject());
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
