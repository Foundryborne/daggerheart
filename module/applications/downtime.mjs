import { actionsTypes } from '../data/_module.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DhpDowntime extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(actor, shortrest) {
        super({});

        this.actor = actor;
        this.shortrest = shortrest;

        const options = game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Homebrew).restMoves;
        this.moveData = shortrest ? options.shortRest : options.longRest;
    }

    get title() {
        return '';
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'views', 'downtime'],
        position: { width: 680, height: 'auto' },
        actions: {
            selectMove: this.selectMove,
            takeDowntime: this.takeDowntime
        },
        form: { handler: this.updateData, submitOnChange: true, closeOnSubmit: false }
    };

    static PARTS = {
        application: {
            id: 'downtime',
            template: 'systems/daggerheart/templates/views/downtime.hbs'
        }
    };

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        htmlElement
            .querySelectorAll('.activity-image')
            .forEach(element => element.addEventListener('contextmenu', this.deselectMove.bind(this)));
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.selectedActivity = this.selectedActivity;
        context.moveData = this.moveData;
        context.nrCurrentChoices = Object.values(this.moveData.moves).reduce((acc, x) => acc + (x.selected ?? 0), 0);
        context.disabledDowntime = context.nrCurrentChoices < context.moveData.nrChoices;

        return context;
    }

    static selectMove(_, button) {
        const nrSelected = Object.values(this.moveData.moves).reduce((acc, x) => acc + (x.selected ?? 0), 0);
        if (nrSelected === this.moveData.nrChoices) {
            ui.notifications.error(game.i18n.localize('DAGGERHEART.Downtime.Notifications.NoMoreMoves'));
            return;
        }

        const move = button.dataset.move;
        this.moveData.moves[move].selected = this.moveData.moves[move].selected
            ? this.moveData.moves[move].selected + 1
            : 1;

        this.render();
    }

    deselectMove(event) {
        const move = event.currentTarget.dataset.move;
        this.moveData.moves[move].selected = this.moveData.moves[move].selected
            ? this.moveData.moves[move].selected - 1
            : 0;

        this.render();
    }

    static async takeDowntime() {
        const moves = Object.values(this.moveData.moves).filter(x => x.selected);

        const cls = getDocumentClass('ChatMessage');
        const msg = new cls({
            user: game.user.id,
            system: {
                moves: moves,
                actor: this.actor.uuid
            },
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/chat/downtime.hbs',
                {
                    title: `${this.actor.name} - ${game.i18n.localize(`DAGGERHEART.Downtime.${this.shortRest ? 'ShortRest' : 'LongRest'}.title`)}`,
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
