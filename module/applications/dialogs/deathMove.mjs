import { enrichedFateRoll } from '../../enrichers/FateRollEnricher.mjs';
import { enrichedDualityRoll } from '../../enrichers/DualityRollEnricher.mjs';


const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DhDeathMove extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(actor) {
        super({});

        this.actor = actor;
        this.selectedMove = null;
    }

    get title() {
        return game.i18n.format('DAGGERHEART.APPLICATIONS.DeathMove.title', { actor: this.actor.name });
    }

    static DEFAULT_OPTIONS = {
        classes: ['daggerheart', 'dh-style', 'dialog', 'views', 'death-move'],
        position: { width: 'auto', height: 'auto' },
        window: { icon: 'fa-solid fa-skull' },
        actions: {
            selectMove: this.selectMove,
            takeMove: this.takeMove
        }
    };

    static PARTS = {
        application: {
            id: 'death-move',
            template: 'systems/daggerheart/templates/dialogs/deathMove.hbs'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.selectedMove = this.selectedMove;
        context.options = CONFIG.DH.GENERAL.deathMoves;
        context.title = game.i18n.localize('DAGGERHEART.APPLICATIONS.DeathMove.takeMove');

        return context;
    }

    async handleAvoidDeath() {
        console.log("Avoid Death!");
        const target = this.actor.uuid;
        const config = await enrichedFateRoll({
            target,
            title: "Avoid Death Hope Fate Roll",
            label: 'test',
            fateType: "Hope"
        });
        console.log("enrichedFateRoll done...", config);
        console.log("config.roll.fate.value", config.roll.fate.value);
        console.log("actor", this.actor);
        if (config.roll.fate.value <= this.actor.system.levelData.level.current) {
            // apply scarring - for now directly apply - later add a button.
            console.log("Adding a scar...", this.actor.system.scars);
            const scar = {
                [foundry.utils.randomID()]: { 
                    name: "A scar " + this.actor.system.scars.length,
                    description: "A description"
                }
            }
            console.log("scar", scar);

            console.log('something goes here to update the scars data...');

            
        await this.actor.update(
            {
                system: {
                     scars: {
                        scar
                    }
                }
            },
            { overwrite: true }
        );


            console.log("Adding a scar result", this.actor.system.scars);
        }
    }

    async handleRiskItAll() {
        console.log("Risk It All!");

        const config = await enrichedDualityRoll({
            reaction: true,
            traitValue: null,
            target: null,
            difficulty: null,
            title: "Risk It All",
            label: 'test',
            actionType: null,
            advantage: null
        });

        console.log("config", config);

        if (config.roll.isCritical) {
            console.log("Clear all stress and HP");
            return;
        }

        // Hope
        if (config.roll.result.duality == 1) {
            console.log("Need to clear up Stress and HP up to hope value");
            console.log("Hope rolled", config.roll.hope.value);
            return;
        }

        //Fear
        if (config.roll.result.duality == -1) {
            console.log("You have died...");
            return;
        }
        
    }

    static selectMove(_, button) {
        const move = button.dataset.move;
        this.selectedMove = CONFIG.DH.GENERAL.deathMoves[move];

        this.render();
    }

    static async takeMove() {
        const cls = getDocumentClass('ChatMessage');
        const msg = {
            user: game.user.id,
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/ui/chat/deathMove.hbs',
                {
                    player: this.actor.name,
                    actor: { name: this.actor.name, img: this.actor.img },
                    author: game.users.get(game.user.id),
                    title: game.i18n.localize(this.selectedMove.name),
                    img: this.selectedMove.img,
                    description: game.i18n.localize(this.selectedMove.description)
                }
            ),
            title: game.i18n.localize(
                'DAGGERHEART.UI.Chat.deathMove.title'
            ),
            speaker: cls.getSpeaker(),
            flags: {
                daggerheart: {
                    cssClass: 'dh-chat-message dh-style'
                }
            }
        };

        cls.create(msg);

        this.close();

        if (CONFIG.DH.GENERAL.deathMoves.avoidDeath === this.selectedMove) {
            this.handleAvoidDeath();
            return;
        }

        if (CONFIG.DH.GENERAL.deathMoves.riskItAll === this.selectedMove) {
            this.handleRiskItAll();
            return;
        }

    }
}
