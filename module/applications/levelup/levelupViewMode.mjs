import { chunkify } from '../../helpers/utils.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DhlevelUpViewMode extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(actor) {
        super({});

        this.actor = actor;
    }

    get title() {
        return game.i18n.format('DAGGERHEART.APPLICATIONS.Levelup.viewModeTitle', { actor: this.actor.name });
    }

    static DEFAULT_OPTIONS = {
        classes: ['daggerheart', 'dialog', 'dh-style', 'levelup'],
        position: { width: 1000, height: 'auto' },
        window: {
            resizable: true,
            icon: 'fa-solid fa-arrow-turn-up'
        }
    };

    static PARTS = {
        main: { template: 'systems/daggerheart/templates/levelup/tabs/viewMode.hbs' }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);

        const { tiers } = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.LevelTiers);
        const tierKeys = Object.keys(tiers);
        const selections = Object.keys(this.actor.system.levelData.levelups).reduce(
            (acc, key) => {
                const level = this.actor.system.levelData.levelups[key];
                Object.keys(level.selections).forEach(optionKey => {
                    const choice = level.selections[optionKey];
                    if (!acc[choice.tier][choice.optionKey]) acc[choice.tier][choice.optionKey] = {};
                    acc[choice.tier][choice.optionKey][choice.checkboxNr] = choice;
                });

                return acc;
            },
            tierKeys.reduce((acc, key) => {
                acc[key] = {};
                return acc;
            }, {})
        );

        context.tiers = tierKeys.map((tierKey, tierIndex) => {
            const tier = tiers[tierKey];

            return {
                name: tier.name,
                active: true,
                groups: Object.keys(tier.options).map(optionKey => {
                    const option = tier.options[optionKey];

                    const checkboxes = [...Array(option.checkboxSelections).keys()].flatMap(index => {
                        const checkboxNr = index + 1;
                        const checkboxData = selections[tierKey]?.[optionKey]?.[checkboxNr];
                        const checkbox = { ...option, checkboxNr, tier: tierKey, disabled: true };

                        if (checkboxData) {
                            checkbox.level = checkboxData.level;
                            checkbox.selected = true;
                        }

                        return checkbox;
                    });

                    let label = game.i18n.localize(option.label);
                    return {
                        label: label,
                        checkboxGroups: chunkify(checkboxes, option.minCost, chunkedBoxes => {
                            const anySelected = chunkedBoxes.some(x => x.selected);
                            const anyDisabled = chunkedBoxes.some(x => x.disabled);
                            return {
                                multi: option.minCost > 1,
                                checkboxes: chunkedBoxes.map(x => ({
                                    ...x,
                                    selected: anySelected,
                                    disabled: anyDisabled
                                }))
                            };
                        })
                    };
                })
            };
        });

        return context;
    }
}
