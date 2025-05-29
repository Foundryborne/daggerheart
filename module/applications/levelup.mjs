import { DhLevelup } from '../data/levelup.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DhlevelUp extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(actor) {
        super({});

        this.actor = actor;
        this.levelTiers = game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.LevelTiers);

        const playerLevelupData = actor.system.levelData;
        this.levelup = new DhLevelup(DhLevelup.initializeData(this.levelTiers, playerLevelupData, actor.system.level));
    }

    get title() {
        return `${this.actor.name} - Level Up`;
    }

    static DEFAULT_OPTIONS = {
        classes: ['daggerheart', 'levelup'],
        position: { width: 1000, height: 'auto' },
        window: {
            resizable: true
        },
        actions: {
            save: this.save
        }
    };

    static PARTS = {
        form: {
            id: 'levelup',
            template: 'systems/daggerheart/templates/views/levelup.hbs'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.levelup = this.levelup;

        return context;
    }

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);
        $(htmlElement).find('.selection-checkbox').on('change', this.selectionClick.bind(this));
    }

    async selectionClick(event) {
        const button = event.currentTarget;

        if (!button.checked) {
            await this.levelup.updateSource({
                [`tiers.${button.dataset.tier}.levels.${button.dataset.level}.optionSelections.${button.dataset.option}.-=${button.dataset.checkboxNr}`]:
                    null
            });
        } else {
            const levelSelections = this.levelup.levelSelections;
            if (levelSelections.total + Number(button.dataset.cost) > this.levelup.maxSelections) {
                ui.notifications.info(
                    game.i18n.localize('DAGGERHEART.Application.LevelUp.notifications.info.insufficentAdvancements')
                );
                this.render();
                return;
            }

            const nrTiers = Object.keys(this.levelup.tiers).length;
            let lowestLevelChoice = null;
            for (var tierKey = Number(button.dataset.tier); tierKey <= nrTiers + 1; tierKey++) {
                const tier = this.levelup.tiers[tierKey];
                lowestLevelChoice = Object.keys(levelSelections.available).reduce((currentLowest, key) => {
                    const level = Number(key);
                    if (levelSelections.available[key] >= button.dataset.cost && tier.belongingLevels.includes(level)) {
                        if (!currentLowest || level < currentLowest) return level;
                    }

                    return currentLowest;
                }, null);

                if (lowestLevelChoice) break;
            }

            if (!lowestLevelChoice) {
                ui.notifications.info(
                    game.i18n.localize(
                        'DAGGERHEART.Application.LevelUp.notifications.info.insufficientTierAdvancements'
                    )
                );
                this.render();
                return;
            }

            await this.levelup.updateSource({
                [`tiers.${button.dataset.tier}.levels.${lowestLevelChoice}.optionSelections.${button.dataset.option}.${button.dataset.checkboxNr}`]:
                    { selected: true, minCost: button.dataset.cost }
            });
        }

        this.render();
    }

    static async save() {
        await this.actor.update({
            'system.levelData': {
                'level.current': this.actor.system.levelData.level.changed,
                'selections': this.levelup.playerData
            }
        });

        this.close();
    }
}
