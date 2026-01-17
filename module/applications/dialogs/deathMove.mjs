import { enrichedFateRoll } from '../../enrichers/FateRollEnricher.mjs';
import { enrichedDualityRoll } from '../../enrichers/DualityRollEnricher.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;
export default class DhDeathMove extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(actor) {
        super({});

        this.actor = actor;
        this.selectedMove = null;
        this.showRiskItAllButton = false;
        this.riskItAllButtonLabel = '';
        this.riskItAllHope = 0;
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
        const target = this.actor.uuid;
        const config = await enrichedFateRoll({
            target,
            title: game.i18n.localize('DAGGERHEART.CONFIG.DeathMoves.avoidDeath.name'),
            label: `${game.i18n.localize('DAGGERHEART.GENERAL.hope')} ${game.i18n.localize('DAGGERHEART.GENERAL.fateRoll')}`,
            fateType: 'Hope'
        });

        if (!config.roll.fate) return;

        if (config.roll.fate.value <= this.actor.system.levelData.level.current) {
            // apply scarring - for now directly apply - later add a button.
            const newScarAmount = this.actor.system.scars + 1;

            await this.actor.update({
                system: {
                    scars: newScarAmount
                }
            });

            if (newScarAmount >= this.actor.system.resources.hope.max) {
                return game.i18n.format('DAGGERHEART.UI.Chat.deathMove.journeysEnd', { scars: newScarAmount });
            }

            return game.i18n.localize('DAGGERHEART.UI.Chat.deathMove.gainScar');
        }

        return game.i18n.localize('DAGGERHEART.UI.Chat.deathMove.avoidScar');
    }

    async handleRiskItAll() {
        const config = await enrichedDualityRoll({
            reaction: true,
            traitValue: null,
            target: this.actor,
            difficulty: null,
            title: game.i18n.localize('DAGGERHEART.CONFIG.DeathMoves.riskItAll.name'),
            label: game.i18n.localize('DAGGERHEART.GENERAL.dualityDice'),
            actionType: null,
            advantage: null,
            customConfig: { skips: { resources: true, reaction: true } }
        });

        if (!config.roll.result) return;

        const clearAllStressAndHitpointsUpdates = [
            { key: 'hitPoints', clear: true },
            { key: 'stress', clear: true }
        ];

        let chatMessage = '';
        if (config.roll.isCritical) {
            config.resourceUpdates.addResources(clearAllStressAndHitpointsUpdates);
            chatMessage = game.i18n.localize('DAGGERHEART.UI.Chat.deathMove.riskItAllCritical');
        }

        if (config.roll.result.duality == 1) {
            if (
                config.roll.hope.value >=
                this.actor.system.resources.hitPoints.value + this.actor.system.resources.stress.value
            ) {
                config.resourceUpdates.addResources(clearAllStressAndHitpointsUpdates);
                chatMessage = game.i18n.localize('DAGGERHEART.UI.Chat.deathMove.riskItAllSuccessWithEnoughHope');
            } else {
                chatMessage = game.i18n.format('DAGGERHEART.UI.Chat.deathMove.riskItAllSuccess', {
                    hope: config.roll.hope.value
                });
                this.showRiskItAllButton = true;
                this.riskItAllHope = config.roll.hope.value;
                this.riskItAllButtonLabel = game.i18n.format('DAGGERHEART.UI.Chat.deathMove.riskItAllDialogButton');
            }
        }

        if (config.roll.result.duality == -1) {
            chatMessage = game.i18n.localize('DAGGERHEART.UI.Chat.deathMove.riskItAllFailure');
        }

        await config.resourceUpdates.updateResources();
        return chatMessage;
    }

    async handleBlazeOfGlory() {
        this.actor.createEmbeddedDocuments('ActiveEffect', [
            {
                name: game.i18n.localize('DAGGERHEART.CONFIG.DeathMoves.blazeOfGlory.name'),
                description: game.i18n.localize('DAGGERHEART.CONFIG.DeathMoves.blazeOfGlory.description'),
                img: CONFIG.DH.GENERAL.deathMoves.blazeOfGlory.img,
                changes: [
                    {
                        key: 'system.rules.roll.guaranteedCritical',
                        mode: 2,
                        value: 'true'
                    }
                ]
            }
        ]);

        return game.i18n.localize('DAGGERHEART.UI.Chat.deathMove.blazeOfGlory');
    }

    static selectMove(_, button) {
        const move = button.dataset.move;
        this.selectedMove = CONFIG.DH.GENERAL.deathMoves[move];

        this.render();
    }

    static async takeMove() {
        this.close();

        let result = '';

        if (CONFIG.DH.GENERAL.deathMoves.blazeOfGlory === this.selectedMove) {
            result = await this.handleBlazeOfGlory();
        }

        if (CONFIG.DH.GENERAL.deathMoves.avoidDeath === this.selectedMove) {
            result = await this.handleAvoidDeath();
        }

        if (CONFIG.DH.GENERAL.deathMoves.riskItAll === this.selectedMove) {
            result = await this.handleRiskItAll();
        }

        if (!result) return;

        const autoExpandDescription = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.appearance)
            .expandRollMessage?.desc;
        const cls = getDocumentClass('ChatMessage');

        const msg = {
            user: game.user.id,
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/ui/chat/deathMove.hbs',
                {
                    player: this.actor.name,
                    actor: this.actor,
                    actorId: this.actor._id,
                    author: game.users.get(game.user.id),
                    title: game.i18n.localize(this.selectedMove.name),
                    img: this.selectedMove.img,
                    description: game.i18n.localize(this.selectedMove.description),
                    result: result,
                    open: autoExpandDescription ? 'open' : '',
                    chevron: autoExpandDescription ? 'fa-chevron-up' : 'fa-chevron-down',
                    showRiskItAllButton: this.showRiskItAllButton,
                    riskItAllButtonLabel: this.riskItAllButtonLabel,
                    riskItAllHope: this.riskItAllHope
                }
            ),
            title: game.i18n.localize('DAGGERHEART.UI.Chat.deathMove.title'),
            speaker: cls.getSpeaker(),
            flags: {
                daggerheart: {
                    cssClass: 'dh-chat-message dh-style'
                }
            }
        };

        cls.create(msg);
    }
}
