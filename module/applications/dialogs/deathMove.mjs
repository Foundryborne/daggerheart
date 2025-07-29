const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DhpDeathMove extends HandlebarsApplicationMixin(ApplicationV2) {
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

    static selectMove(_, button) {
        const move = button.dataset.move;
        this.selectedMove = CONFIG.DH.GENERAL.deathMoves[move];

        this.render();
    }

    static async takeMove() {
        const cls = getDocumentClass('ChatMessage');
        const msg = new cls({
            user: game.user.id,
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/ui/chat/deathMove.hbs',
                {
                    player: this.actor.name,
                    title: game.i18n.localize(this.selectedMove.name),
                    img: this.selectedMove.img,
                    description: game.i18n.localize(this.selectedMove.description)
                }
            )
        });

        cls.create(msg.toObject());

        this.close();
    }
}
