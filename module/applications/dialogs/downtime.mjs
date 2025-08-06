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
                taken: 0,
                max:
                    (shortrest ? this.moveData.shortRest.nrChoices : 0) +
                    actor.system.bonuses.rest[`${shortrest ? 'short' : 'long'}Rest`].shortMoves
            },
            longRest: {
                taken: 0,
                max:
                    (!shortrest ? this.moveData.longRest.nrChoices : 0) +
                    actor.system.bonuses.rest[`${shortrest ? 'short' : 'long'}Rest`].longMoves
            }
        };

        this.refreshables = this.getRefreshables();
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

        const shortRestMovesSelected = this.nrSelectedMoves('shortRest');
        const longRestMovesSelected = this.nrSelectedMoves('longRest');
        context.nrChoices = {
            ...this.nrChoices,
            shortRest: {
                ...this.nrChoices.shortRest,
                current: this.nrChoices.shortRest.taken + shortRestMovesSelected
            },
            longRest: {
                ...this.nrChoices.longRest,
                current: this.nrChoices.longRest.taken + longRestMovesSelected
            }
        };

        context.shortRestMoves = this.nrChoices.shortRest.max > 0 ? this.moveData.shortRest : null;
        context.longRestMoves = this.nrChoices.longRest.max > 0 ? this.moveData.longRest : null;

        context.refreshables = this.refreshables;

        context.disabledDowntime = shortRestMovesSelected === 0 && longRestMovesSelected === 0;

        return context;
    }

    getRefreshables() {
        const actionItems = this.actor.items.reduce((acc, x) => {
            if (x.system.actions) {
                const recoverable = x.system.actions.reduce((acc, action) => {
                    if (action.uses.recovery && (action.uses.recovery === 'shortRest') === this.shortrest) {
                        acc.push({
                            title: x.name,
                            name: action.name,
                            uuid: action.uuid
                        });
                    }

                    return acc;
                }, []);

                if (recoverable) {
                    acc.push(...recoverable);
                }
            }

            return acc;
        }, []);
        const resourceItems = this.actor.items.reduce((acc, x) => {
            if (
                x.system.resource &&
                x.system.resource.type &&
                (x.system.resource.recovery === 'shortRest') === this.shortrest
            ) {
                acc.push({
                    title: game.i18n.localize(`TYPES.Item.${x.type}`),
                    name: x.name,
                    uuid: x.uuid
                });
            }

            return acc;
        }, []);
        return {
            actionItems,
            resourceItems
        };
    }

    static selectMove(_, target) {
        const { category, move } = target.dataset;

        const nrSelected = this.nrSelectedMoves(category);

        if (nrSelected + this.nrChoices[category].taken >= this.nrChoices[category].max) {
            ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.noMoreMoves'));
            return;
        }

        this.moveData[category].moves[move].selected = this.moveData[category].moves[move].selected
            ? this.moveData[category].moves[move].selected + 1
            : 1;

        this.render();
    }

    deselectMove(event) {
        const button = event.target.closest('.activity-container');
        const { move, category } = button.dataset;
        this.moveData[category].moves[move].selected = this.moveData[category].moves[move].selected
            ? this.moveData[category].moves[move].selected - 1
            : 0;

        this.render();

        // On macOS with a single-button mouse (e.g. a laptop trackpad),
        // right-click is triggered with ctrl+click, which triggers both a
        // `contextmenu` event and a regular click event. We need to stop
        // event propagation to prevent the click event from triggering the
        // `selectMove` function and undoing the change we just made.
        event.stopPropagation();

        // Having stopped propagation, we're no longer subject to Foundry's
        // default `contextmenu` handler, so we also have to prevent the
        // default behaviour to prevent a context menu from appearing.
        event.preventDefault();
    }

    static async takeDowntime() {
        const moves = Object.values(this.moveData).flatMap(category => {
            return Object.values(category.moves)
                .filter(x => x.selected)
                .flatMap(move => [...Array(move.selected).keys()].map(_ => move));
        });

        const cls = getDocumentClass('ChatMessage');
        const msg = {
            user: game.user.id,
            system: {
                moves: moves,
                actor: this.actor.uuid
            },
            speaker: cls.getSpeaker(),
            title: game.i18n.localize(
                `DAGGERHEART.APPLICATIONS.Downtime.${this.shortrest ? 'shortRest' : 'longRest'}.title`
            ),
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/ui/chat/downtime.hbs',
                {
                    title: game.i18n.localize(
                        `DAGGERHEART.APPLICATIONS.Downtime.${this.shortrest ? 'shortRest' : 'longRest'}.title`
                    ),
                    actor: { name: this.actor.name, img: this.actor.img },
                    moves: moves
                }
            ),
            flags: {
                daggerheart: {
                    cssClass: 'dh-chat-message dh-style'
                }
            }
        };

        cls.create(msg);

        // Reset selection and update number of taken moves
        for (const [catName, category] of Object.entries(this.moveData)) {
            for (const move of Object.values(category.moves)) {
                if (move.selected > 0) {
                    this.nrChoices[catName].taken += move.selected;
                    move.selected = 0;
                }
            }
        }

        // We can close the window and refresh resources when all moves are taken
        if (
            this.nrChoices.shortRest.taken >= this.nrChoices.shortRest.max &&
            this.nrChoices.longRest.taken >= this.nrChoices.longRest.max
        ) {
            for (var data of this.refreshables.actionItems) {
                const action = await foundry.utils.fromUuid(data.uuid);
                await action.parent.parent.update({ [`system.actions.${action.id}.uses.value`]: action.uses.max ?? 1 });
            }

            for (var data of this.refreshables.resourceItems) {
                const feature = await foundry.utils.fromUuid(data.uuid);
                const increasing =
                    feature.system.resource.progression === CONFIG.DH.ITEM.itemResourceProgression.increasing.id;
                const resetValue = increasing
                    ? 0
                    : feature.system.resource.max
                      ? Roll.replaceFormulaData(feature.system.resource.max, this.actor)
                      : 0;
                await feature.update({ 'system.resource.value': resetValue });
            }

            this.close();
        } else {
            this.render();
        }
    }

    static async updateData(event, element, formData) {
        this.customActivity = foundry.utils.mergeObject(this.customActivity, formData.object);
        this.render();
    }

    nrSelectedMoves(category) {
        return Object.values(this.moveData[category].moves).reduce((acc, x) => acc + (x.selected ?? 0), 0);
    }
}
