const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DhpDowntime extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(actor, shortrest) {
        super({});

        this.actor = actor;
        this.shortrest = shortrest;

        this.moveData = foundry.utils.deepClone(
            game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).restMoves
        );
        this.nrChoices = {
            shortRest: {
                max:
                    (shortrest ? this.moveData.shortRest.nrChoices : 0) +
                    actor.system.bonuses.rest[`${shortrest ? 'short' : 'long'}Rest`].shortMoves
            },
            longRest: {
                max:
                    (!shortrest ? this.moveData.longRest.nrChoices : 0) +
                    actor.system.bonuses.rest[`${shortrest ? 'short' : 'long'}Rest`].longMoves
            }
        };
        this.nrChoices.total = { max: this.nrChoices.shortRest.max + this.nrChoices.longRest.max };
    }

    get title() {
        return '';
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'views', 'dh-style', 'dialog', 'downtime'],
        position: { width: 'auto', height: 'auto' },
        actions: {
            selectMove: this.selectMove,
            takeDowntime: this.takeDowntime
        },
        form: { handler: this.updateData, submitOnChange: true, closeOnSubmit: false }
    };

    static PARTS = {
        application: {
            id: 'downtime',
            template: 'systems/daggerheart/templates/dialogs/downtime/downtime.hbs'
        }
    };

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        htmlElement
            .querySelectorAll('.activity-container')
            .forEach(element => element.addEventListener('contextmenu', this.deselectMove.bind(this)));
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.title = game.i18n.localize(
            `DAGGERHEART.APPLICATIONS.Downtime.${this.shortrest ? 'shortRest' : 'longRest'}.title`
        );
        context.selectedActivity = this.selectedActivity;
        context.moveData = this.moveData;
        context.nrCurrentChoices = Object.values(this.moveData).reduce((acc, category) => {
            acc += Object.values(category.moves).reduce((acc, x) => acc + (x.selected ?? 0), 0);
            return acc;
        }, 0);

        context.nrChoices = {
            ...this.nrChoices,
            shortRest: {
                ...this.nrChoices.shortRest,
                current: Object.values(this.moveData.shortRest.moves).reduce((acc, x) => acc + (x.selected ?? 0), 0)
            },
            longRest: {
                ...this.nrChoices.longRest,
                current: Object.values(this.moveData.longRest.moves).reduce((acc, x) => acc + (x.selected ?? 0), 0)
            }
        };
        context.nrChoices.total = {
            ...this.nrChoices.total,
            current: context.nrChoices.shortRest.current + context.nrChoices.longRest.current
        };

        context.shortRestMoves = this.nrChoices.shortRest.max > 0 ? this.moveData.shortRest : null;
        context.longRestMoves = this.nrChoices.longRest.max > 0 ? this.moveData.longRest : null;

        context.disabledDowntime = context.nrChoices.total.current < context.nrChoices.total.max;

        return context;
    }

    static selectMove(_, target) {
        const nrSelected = Object.values(this.moveData[target.dataset.category].moves).reduce(
            (acc, x) => acc + (x.selected ?? 0),
            0
        );

        if (nrSelected === this.nrChoices[target.dataset.category].max) {
            ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.noMoreMoves'));
            return;
        }

        const move = target.dataset.move;
        this.moveData[target.dataset.category].moves[move].selected = this.moveData[target.dataset.category].moves[move]
            .selected
            ? this.moveData[target.dataset.category].moves[move].selected + 1
            : 1;

        this.render();
    }

    deselectMove(event) {
        const button = event.target.closest('.activity-container');
        const move = button.dataset.move;
        this.moveData[button.dataset.category].moves[move].selected = this.moveData[button.dataset.category].moves[move]
            .selected
            ? this.moveData[button.dataset.category].moves[move].selected - 1
            : 0;

        this.render();
    }

    static async takeDowntime() {
        const moves = Object.values(this.moveData).flatMap(category => {
            return Object.values(category.moves)
                .filter(x => x.selected)
                .flatMap(move => [...Array(move.selected).keys()].map(_ => move));
        });

        const cls = getDocumentClass('ChatMessage');
        const msg = new cls({
            user: game.user.id,
            system: {
                moves: moves,
                actor: this.actor.uuid
            },
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/ui/chat/downtime.hbs',
                {
                    title: `${this.actor.name} - ${game.i18n.localize(`DAGGERHEART.APPLICATIONS.Downtime.${this.shortRest ? 'shortRest' : 'longRest'}.title`)}`,
                    moves: moves
                }
            )
        });

        cls.create(msg.toObject());

        this.close();
    }

    static async updateData(event, element, formData) {
        this.customActivity = foundry.utils.mergeObject(this.customActivity, formData.object);
        this.render();
    }
}
