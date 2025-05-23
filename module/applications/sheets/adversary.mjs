// import DhpApplicationMixin from '../daggerheart-sheet.mjs';

// export class Teest extends DhpApplicationMixin(ActorSheet) {
//     static documentType = "adversary";

//     constructor(options){
//         super(options);

//         this.editMode = false;
//     }

//     /** @override */
//     static get defaultOptions() {
//         return foundry.utils.mergeObject(super.defaultOptions, {
//             classes: ["daggerheart", "sheet", "adversary"],
//             width: 600,
//             height: 'auto',
//             resizable: false,
//         });
//     }

//     async getData() {
//         const context = super.getData();
//         context.config = SYSTEM;
//         context.editMode = this.editMode;
//         context.title = `${this.actor.name} - ${game.i18n.localize(SYSTEM.ACTOR.adversaryTypes[this.actor.system.type].name)}`;

//         context.data = {
//             description: this.object.system.description,
//             motivesAndTactics: this.object.system.motivesAndTactics.join(', '),
//             tier: this.object.system.tier,
//             type: game.i18n.localize(SYSTEM.ACTOR.adversaryTypes[this.object.system.type].name),
//             attack: {
//                 name: this.object.system.attack.name,
//                 attackModifier: this.object.system.attackModifier,
//                 range: this.object.system.attack.range ? game.i18n.localize(SYSTEM.GENERAL.range[this.object.system.attack.range].name) : null,
//                 damage: {
//                     value: this.object.system.attack.damage.value,
//                     type: this.object.system.attack.damage.type,
//                     typeName: this.object.system.attack.damage.type ? game.i18n.localize(SYSTEM.GENERAL.damageTypes[this.object.system.attack.damage.type].abbreviation).toLowerCase() : null,
//                 },
//             },
//             damageThresholds: this.object.system.damageThresholds,
//             difficulty: this.object.system.difficulty,
//             hp: { ...this.object.system.resources.health, lastRowIndex: Math.floor(this.object.system.resources.health.max/5)*5 },
//             stress: { ...this.object.system.resources.stress, lastRowIndex: Math.floor(this.object.system.resources.stress.max/5)*5  },
//             moves: this.object.system.moves,
//         };

//         return context;
//     }

//     async _handleAction(action, event, button) {
//         switch(action){
//             case 'viewMove':
//                 await this.viewMove(button);
//                 break;
//             case 'addMove':
//                 this.addMove();
//                 break;
//             case 'removeMove':
//                 await this.removeMove(button);
//                 break;
//             case 'toggleSlider':
//                 this.toggleEditMode();
//                 break;
//             case 'addMotive':
//                 await this.addMotive();
//                 break;
//             case 'removeMotive':
//                 await this.removeMotive(button);
//                 break;
//             case 'reactionRoll':
//                 await this.reactionRoll(event);
//                 break;
//             case 'attackRoll':
//                 await this.attackRoll(event);
//                 break;
//             case 'addExperience':
//                 await this.addExperience();
//                 break;
//             case 'removeExperience':
//                 await this.removeExperience(button);
//                 break;
//             case 'toggleHP':
//                 await this.toggleHP(button);
//                 break;
//             case 'toggleStress':
//                 await this.toggleStress(button);
//                 break;
//         }
//     }

//     async viewMove(button){
//         const move = await fromUuid(button.dataset.move);
//         move.sheet.render(true);
//     }

//     async addMove(){
//         const result = await this.object.createEmbeddedDocuments("Item", [{
//             name: game.i18n.localize('DAGGERHEART.Sheets.Adversary.NewMove'),
//             type: 'feature',
//         }]);

//         await result[0].sheet.render(true);
//     }

//     async removeMove(button){
//         await this.object.items.find(x => x.uuid === button.dataset.move).delete();
//     }

//     toggleEditMode(){
//         this.editMode = !this.editMode;
//         this.render();
//     }

//     async addMotive(){
//         await this.object.update({ "system.motivesAndTactics": [...this.object.system.motivesAndTactics, ''] });
//     }

//     async removeMotive(button){
//         await this.object.update({ "system.motivesAndTactics": this.object.system.motivesAndTactics.filter((_, index) => index !== Number.parseInt(button.dataset.motive) )});
//     }

//     async reactionRoll(event){
//         const { roll, diceResults, modifiers } = await this.actor.diceRoll({ title: `${this.actor.name} - Reaction Roll`, value: 0 }, event.shiftKey);

//         const cls = getDocumentClass("ChatMessage");
//         const msg = new cls({
//             type: 'adversaryRoll',
//             system: {
//                 roll: roll._formula,
//                 total: roll._total,
//                 modifiers: modifiers,
//                 diceResults: diceResults,
//             },
//             content: "systems/daggerheart/templates/chat/adversary-roll.hbs",
//             rolls: [roll]
//         });

//         cls.create(msg.toObject());
//     }

//     async attackRoll(event){
//         const modifier = Number.parseInt(event.currentTarget.dataset.value);

//         const { roll, diceResults, modifiers } = await this.actor.diceRoll({ title: `${this.actor.name} - Attack Roll`, value: modifier }, event.shiftKey);

//         const targets = Array.from(game.user.targets).map(x => ({
//             id: x.id,
//             name: x.actor.name,
//             img: x.actor.img,
//             difficulty: x.actor.system.difficulty,
//             evasion: x.actor.system.evasion,
//         }));

//         const cls = getDocumentClass("ChatMessage");
//         const msg = new cls({
//             type: 'adversaryRoll',
//             system: {
//                 roll: roll._formula,
//                 total: roll._total,
//                 modifiers: modifiers,
//                 diceResults: diceResults,
//                 targets: targets,
//                 damage: { value: event.currentTarget.dataset.damage, type: event.currentTarget.dataset.damageType },
//             },
//             content: "systems/daggerheart/templates/chat/adversary-attack-roll.hbs",
//             rolls: [roll]
//         });

//         cls.create(msg.toObject());
//     }

//     async addExperience(){
//         await this.object.update({ "system.experiences": [...this.object.system.experiences, { name: 'Experience', value: 1 }] });
//     }

//     async removeExperience(button){
//         await this.object.update({ "system.experiences": this.object.system.experiences.filter((_, index) => index !== Number.parseInt(button.dataset.experience) )});
//     }

//     async toggleHP(button){
//         const index = Number.parseInt(button.dataset.index);
//         const newHP = index < this.object.system.resources.health.value ? index : index+1;
//         await this.object.update({ "system.resources.health.value": newHP });
//     }

//     async toggleStress(button){
//         const index = Number.parseInt(button.dataset.index);
//         const newStress = index < this.object.system.resources.stress.value ? index : index+1;
//         await this.object.update({ "system.resources.stress.value": newStress });
//     }
// }

import DaggerheartSheet from './daggerheart-sheet.mjs';

const { ActorSheetV2 } = foundry.applications.sheets;
export default class AdversarySheet extends DaggerheartSheet(ActorSheetV2) {
    constructor(options = {}) {
        super(options);

        this.editMode = false;
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        id: 'daggerheart-adversary',
        classes: ['daggerheart', 'sheet', 'adversary'],
        position: { width: 600 },
        actions: {
            viewMove: this.viewMove,
            addMove: this.addMove,
            removeMove: this.removeMove,
            toggleSlider: this.toggleEditMode,
            addMotive: this.addMotive,
            removeMotive: this.removeMotive,
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
        form: {
            id: 'feature',
            template: 'systems/daggerheart/templates/sheets/adversary.hbs'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.document = this.document;
        context.config = SYSTEM;
        context.editMode = this.editMode;
        context.title = `${this.actor.name} - ${game.i18n.localize(SYSTEM.ACTOR.adversaryTypes[this.actor.system.type].name)}`;

        context.data = {
            description: this.document.system.description,
            motivesAndTactics: this.document.system.motivesAndTactics.join(', '),
            tier: this.document.system.tier,
            type: game.i18n.localize(SYSTEM.ACTOR.adversaryTypes[this.document.system.type].name),
            attack: {
                name: this.document.system.attack.name,
                attackModifier: this.document.system.attackModifier,
                range: this.document.system.attack.range
                    ? game.i18n.localize(SYSTEM.GENERAL.range[this.document.system.attack.range].name)
                    : null,
                damage: {
                    value: this.document.system.attack.damage.value,
                    type: this.document.system.attack.damage.type,
                    typeName: this.document.system.attack.damage.type
                        ? game.i18n
                              .localize(
                                  SYSTEM.GENERAL.damageTypes[this.document.system.attack.damage.type].abbreviation
                              )
                              .toLowerCase()
                        : null
                }
            },
            damageThresholds: this.document.system.damageThresholds,
            difficulty: this.document.system.difficulty,
            hp: {
                ...this.document.system.resources.health,
                lastRowIndex: Math.floor(this.document.system.resources.health.max / 5) * 5
            },
            stress: {
                ...this.document.system.resources.stress,
                lastRowIndex: Math.floor(this.document.system.resources.stress.max / 5) * 5
            },
            moves: this.document.system.moves
        };

        return context;
    }

    static async updateForm(event, _, formData) {
        await this.document.update(formData.object);
        this.render();
    }

    static async viewMove(_, button) {
        const move = await fromUuid(button.dataset.move);
        move.sheet.render(true);
    }

    static async addMove() {
        const result = await this.document.createEmbeddedDocuments('Item', [
            {
                name: game.i18n.localize('DAGGERHEART.Sheets.Adversary.NewMove'),
                type: 'feature'
            }
        ]);

        await result[0].sheet.render(true);
    }

    static async removeMove(_, button) {
        await this.document.items.find(x => x.uuid === button.dataset.move).delete();
    }

    static toggleEditMode() {
        this.editMode = !this.editMode;
        this.render();
    }

    static async addMotive() {
        await this.document.update({ 'system.motivesAndTactics': [...this.document.system.motivesAndTactics, ''] });
    }

    static async removeMotive(button) {
        await this.document.update({
            'system.motivesAndTactics': this.document.system.motivesAndTactics.filter(
                (_, index) => index !== Number.parseInt(button.dataset.motive)
            )
        });
    }

    static async reactionRoll(event) {
        const { roll, diceResults, modifiers } = await this.actor.diceRoll(
            { title: `${this.actor.name} - Reaction Roll`, value: 0 },
            event.shiftKey
        );

        const cls = getDocumentClass('ChatMessage');
        const msg = new cls({
            type: 'adversaryRoll',
            system: {
                roll: roll._formula,
                total: roll._total,
                modifiers: modifiers,
                diceResults: diceResults
            },
            content: 'systems/daggerheart/templates/chat/adversary-roll.hbs',
            rolls: [roll]
        });

        cls.create(msg.toObject());
    }

    static async attackRoll(event, button) {
        const modifier = Number.parseInt(button.dataset.value);

        const { roll, diceResults, modifiers } = await this.actor.diceRoll(
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
        const msg = new cls({
            type: 'adversaryRoll',
            system: {
                roll: roll._formula,
                total: roll._total,
                modifiers: modifiers,
                diceResults: diceResults,
                targets: targets,
                damage: { value: button.dataset.damage, type: button.dataset.damageType }
            },
            content: 'systems/daggerheart/templates/chat/adversary-attack-roll.hbs',
            rolls: [roll]
        });

        cls.create(msg.toObject());
    }

    static async addExperience() {
        await this.document.update({
            'system.experiences': [...this.document.system.experiences, { name: 'Experience', value: 1 }]
        });
    }

    static async removeExperience(_, button) {
        await this.document.update({
            'system.experiences': this.document.system.experiences.filter(
                (_, index) => index !== Number.parseInt(button.dataset.experience)
            )
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
