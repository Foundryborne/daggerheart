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
        position: { width: 1200, height: 'auto' },
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
            if (levelSelections.total >= this.levelup.maxSelections) {
                // Notification?
                this.render();
                return;
            }

            const tier = this.levelup.tiers[button.dataset.tier];
            const tierLevels = Object.keys(tier.levels).map(level => Number(level));
            const lowestLevelChoice = Object.keys(levelSelections.selections).reduce((currentLowest, key) => {
                const level = Number(key);
                if (tierLevels.includes(level)) {
                    if (!currentLowest || level < currentLowest) return level;
                }

                return currentLowest;
            }, null);

            if (!lowestLevelChoice) {
                // Notification?
                this.render();
                return;
            }

            await this.levelup.updateSource({
                [`tiers.${button.dataset.tier}.levels.${lowestLevelChoice}.optionSelections.${button.dataset.option}.${button.dataset.checkboxNr}`]: true
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
