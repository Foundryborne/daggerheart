const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DhpDeathMove extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(actor) {
        super({});

        this.actor = actor;
        this.selectedMove = null;
    }

    get title() {
        return game.i18n.format('DAGGERHEART.Application.DeathMove.Title', { actor: this.actor.name });
    }

    static DEFAULT_OPTIONS = {
        classes: ['daggerheart', 'views', 'death-move'],
        position: { width: 800, height: 'auto' },
        actions: {
            selectMove: this.selectMove,
            takeMove: this.takeMove
        }
    };

    static PARTS = {
        application: {
            id: 'death-move',
            template: 'systems/daggerheart/templates/views/deathMove.hbs'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.selectedMove = this.selectedMove;
        context.options = SYSTEM.GENERAL.deathMoves;

        return context;
    }

    static selectMove(_, button) {
        const move = button.dataset.move;
        this.selectedMove = SYSTEM.GENERAL.deathMoves[move];

        this.render();
    }

    static async takeMove() {
        const cls = getDocumentClass('ChatMessage');
        const msg = new cls({
            user: game.user.id,
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/chat/deathMove.hbs',
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
