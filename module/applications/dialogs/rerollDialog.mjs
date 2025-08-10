const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class RerollDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(message, options = {}) {
        super(options);

        this.message = message;
        this.damage = Object.keys(message.system.damage).reduce((acc, typeKey) => {
            const type = message.system.damage[typeKey];
            acc[typeKey] = Object.keys(type.parts).reduce((acc, partKey) => {
                const part = type.parts[partKey];
                acc[partKey] = Object.keys(part.dice).reduce((acc, diceKey) => {
                    const dice = part.dice[diceKey];
                    const activeResults = dice.results.filter(x => x.active);
                    acc[diceKey] = {
                        dice: dice.dice,
                        selectedResults: activeResults.length,
                        maxSelected: activeResults.length,
                        results: activeResults.map(x => ({ ...x, selected: true }))
                    };

                    return acc;
                }, {});

                return acc;
            }, {});

            return acc;
        }, {});
    }

    static DEFAULT_OPTIONS = {
        id: 'reroll-dialog',
        classes: ['daggerheart', 'dialog', 'dh-style', 'views', 'reroll-dialog'],
        window: {
            icon: 'fa-solid fa-dice'
        },
        actions: {
            toggleResult: RerollDialog.#toggleResult,
            selectRoll: RerollDialog.#selectRoll,
            doReroll: RerollDialog.#doReroll,
            save: RerollDialog.#save
        }
    };

    /** @override */
    static PARTS = {
        main: {
            id: 'main',
            template: 'systems/daggerheart/templates/dialogs/rerollDialog/main.hbs'
        },
        footer: {
            id: 'footer',
            template: 'systems/daggerheart/templates/dialogs/rerollDialog/footer.hbs'
        }
    };

    get title() {
        return game.i18n.localize('DAGGERHEART.APPLICATIONS.RerollDialog.title');
    }

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        htmlElement.querySelectorAll('.to-reroll-input').forEach(element => {
            element.addEventListener('change', this.toggleDice.bind(this));
        });
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.damage = this.damage;
        context.disabledReroll = !this.getRerollDice().length;
        context.saveDisabled = !this.isSelectionDone();

        return context;
    }

    static async #save() {
        const update = {
            'system.damage': Object.keys(this.damage).reduce((acc, typeKey) => {
                const type = this.damage[typeKey];
                let typeTotal = 0;
                const messageType = this.message.system.damage[typeKey];
                const parts = Object.keys(type).map(partKey => {
                    const part = type[partKey];
                    const messagePart = messageType.parts[partKey];
                    let partTotal = messagePart.modifierTotal;
                    const dice = Object.keys(part).map(diceKey => {
                        const dice = part[diceKey];
                        const total = dice.results.reduce((acc, result) => {
                            if (result.active) acc += result.result;
                            return acc;
                        }, 0);
                        partTotal += total;
                        const messageDice = messagePart.dice[diceKey];
                        return {
                            ...messageDice,
                            total: total,
                            results: dice.results.map(x => ({
                                ...x,
                                hasRerolls: dice.results.length > 1
                            }))
                        };
                    });

                    typeTotal += partTotal;
                    return {
                        ...messagePart,
                        total: partTotal,
                        dice: dice
                    };
                });

                acc[typeKey] = {
                    ...messageType,
                    total: typeTotal,
                    parts: parts
                };

                return acc;
            }, {})
        };
        await this.message.update(update);
        await this.close();
    }

    getRerollDice() {
        const rerollDice = [];
        Object.keys(this.damage).forEach(typeKey => {
            const type = this.damage[typeKey];
            Object.keys(type).forEach(partKey => {
                const part = type[partKey];
                Object.keys(part).forEach(diceKey => {
                    const dice = part[diceKey];
                    Object.keys(dice.results).forEach(resultKey => {
                        const result = dice.results[resultKey];
                        if (result.toReroll) {
                            rerollDice.push({
                                ...result,
                                dice: dice.dice,
                                type: typeKey,
                                part: partKey,
                                dice: diceKey,
                                result: resultKey
                            });
                        }
                    });
                });
            });
        });

        return rerollDice;
    }

    isSelectionDone() {
        const diceFinishedData = [];
        Object.keys(this.damage).forEach(typeKey => {
            const type = this.damage[typeKey];
            Object.keys(type).forEach(partKey => {
                const part = type[partKey];
                Object.keys(part).forEach(diceKey => {
                    const dice = part[diceKey];
                    const selected = dice.results.reduce((acc, result) => acc + (result.active ? 1 : 0), 0);
                    diceFinishedData.push(selected === dice.maxSelected);
                });
            });
        });

        return diceFinishedData.every(x => x);
    }

    toggleDice(event) {
        const target = event.target;
        const { type, part, dice } = target.dataset;
        const toggleDice = this.damage[type][part][dice];

        const existingDiceRerolls = this.getRerollDice().filter(
            x => x.type === type && x.part === part && x.dice === dice
        );

        const allRerolled = existingDiceRerolls.length === toggleDice.results.filter(x => x.active).length;

        toggleDice.toReroll = !allRerolled;
        toggleDice.results.forEach(result => {
            if (result.active) {
                result.toReroll = !allRerolled;
            }
        });

        this.render();
    }

    static #toggleResult(event) {
        event.stopPropagation();

        const target = event.target.closest('.to-reroll-result');
        const { type, part, dice, result } = target.dataset;
        const toggleDice = this.damage[type][part][dice];
        const toggleResult = toggleDice.results[result];
        toggleResult.toReroll = !toggleResult.toReroll;

        const existingDiceRerolls = this.getRerollDice().filter(
            x => x.type === type && x.part === part && x.dice === dice
        );

        const allToReroll = existingDiceRerolls.length === toggleDice.results.length;
        toggleDice.toReroll = allToReroll;

        this.render();
    }

    static async #selectRoll(_, button) {
        const { type, part, dice, result } = button.dataset;

        const diceVal = this.damage[type][part][dice];
        const diceResult = diceVal.results[result];
        if (!diceResult.active && diceVal.results.filter(x => x.active).length === diceVal.maxSelected) {
            return ui.notifications.warn(
                game.i18n.localize('DAGGERHEART.APPLICATIONS.RerollDialog.deselectDiceNotification')
            );
        }

        if (diceResult.active) {
            diceVal.toReroll = false;
            diceResult.toReroll = false;
        }

        diceVal.selectedResults += diceResult.active ? -1 : 1;
        diceResult.active = !diceResult.active;

        this.render();
    }

    static async #doReroll() {
        const toReroll = this.getRerollDice().map(x => {
            const { type, part, dice, result } = x;
            const diceData = this.damage[type][part][dice].results[result];
            return {
                ...diceData,
                dice: this.damage[type][part][dice].dice,
                typeKey: type,
                partKey: part,
                diceKey: dice,
                resultsIndex: result
            };
        });

        const roll = await new Roll(toReroll.map(x => `1${x.dice}`).join(' + ')).evaluate();

        if (game.modules.get('dice-so-nice')?.active) {
            const diceSoNiceRoll = {
                _evaluated: true,
                dice: roll.dice,
                options: { appearance: {} }
            };

            await game.dice3d.showForRoll(diceSoNiceRoll, game.user, true);
        }

        toReroll.forEach((data, index) => {
            const { typeKey, partKey, diceKey, resultsIndex } = data;
            const rerolledDice = roll.dice[index];

            const dice = this.damage[typeKey][partKey][diceKey];
            dice.toReroll = false;
            dice.results[resultsIndex].active = false;
            dice.results[resultsIndex].discarded = true;
            dice.results[resultsIndex].toReroll = false;
            dice.results.splice(dice.results.length, 0, {
                ...rerolledDice.results[0],
                toReroll: false,
                selected: true
            });
        });

        this.render();
    }
}
