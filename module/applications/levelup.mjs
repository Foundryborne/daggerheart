import { DhLevelup } from '../data/levelup.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DhlevelUp extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(actor) {
        super({});

        this.actor = actor;
        this.levelTiers = game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.LevelTiers);

        const playerLevelupData = actor.system.levelData;
        this.levelup = new DhLevelup(DhLevelup.initializeData(this.levelTiers, playerLevelupData, actor.system.level));

        this._dragDrop = this._createDragDropHandlers();
    }

    get title() {
        return game.i18n.format('DAGGERHEART.Application.LevelUp.Title', { actor: this.actor.name });
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'levelup'],
        position: { width: 1000, height: 'auto' },
        window: {
            resizable: true
        },
        actions: {
            save: this.save
        },
        form: {
            handler: this.updateForm,
            submitOnChange: true,
            closeOnSubmit: false
        },
        dragDrop: [{ dragSelector: null, dropSelector: '.levelup-card-selection .card-preview-container' }]
    };

    static PARTS = {
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        advancements: { template: 'systems/daggerheart/templates/views/levelup/tabs/advancements.hbs' },
        selections: { template: 'systems/daggerheart/templates/views/levelup/tabs/selections.hbs' },
        summary: { template: 'systems/daggerheart/templates/views/levelup/tabs/summary.hbs' }
    };

    static TABS = {
        advancements: {
            active: true,
            cssClass: '',
            group: 'primary',
            id: 'advancements',
            icon: null,
            label: 'DAGGERHEART.Application.LevelUp.Tabs.advancement'
        },
        selections: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'selections',
            icon: null,
            label: 'DAGGERHEART.Application.LevelUp.Tabs.selections'
        },
        summary: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'summary',
            icon: null,
            label: 'DAGGERHEART.Application.LevelUp.Tabs.summary'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.levelup = this.levelup;
        context.tabs = this._getTabs(this.constructor.TABS);

        return context;
    }

    async _preparePartContext(partId, context) {
        switch (partId) {
            case 'selections':
                context.advancementChoices = this.levelup.selectionData.reduce((acc, data) => {
                    const advancementChoice = {
                        ...data,
                        path: `tiers.${data.tier}.levels.${data.level}.optionSelections.${data.optionKey}.${data.checkboxNr}.data`
                    };
                    if (acc[data.type]) acc[data.type].push(advancementChoice);
                    else acc[data.type] = [advancementChoice];

                    return acc;
                }, {});

                context.newExperiences = this.levelup.allInitialAchievements.newExperiences;
                const allDomainCards = {
                    ...context.advancementChoices.domainCard,
                    ...this.levelup.domainCards
                };
                const allDomainCardValues = Object.values(allDomainCards);

                context.domainCards = [];
                for (var domainCard of allDomainCardValues) {
                    const uuid = domainCard.data ?? domainCard.uuid;
                    const card = uuid ? await foundry.utils.fromUuid(uuid) : { path: domainCard.path };
                    context.domainCards.push({
                        ...(card.toObject?.() ?? card),
                        emptySubtext: game.i18n.format(
                            'DAGGERHEART.Application.LevelUp.Selections.emptyDomainCardHint',
                            { level: domainCard.level }
                        ),
                        limit: domainCard.level
                    });
                }

                break;
            case 'summary':
                const actorArmor = this.actor.system.armor;
                const { current: currentLevel, changed: changedLevel } = this.actor.system.levelData.level;
                context.levelAchievements = {
                    statisticIncreases: {
                        proficiency: {
                            old: this.actor.system.proficiency,
                            new: this.actor.system.proficiency + this.levelup.allInitialAchievements.proficiency
                        },
                        damageThresholds: {
                            major: {
                                old: this.actor.system.damageThresholds.major,
                                new: this.actor.system.damageThresholds.major + changedLevel - currentLevel
                            },
                            severe: {
                                old: this.actor.system.damageThresholds.severe,
                                new:
                                    this.actor.system.damageThresholds.severe +
                                    (actorArmor ? changedLevel - currentLevel : (changedLevel - currentLevel) * 2)
                            },
                            unarmored: !actorArmor
                        }
                    }
                };

                break;
        }

        return context;
    }

    _getTabs(tabs) {
        for (const v of Object.values(tabs)) {
            v.active = this.tabGroups[v.group] ? this.tabGroups[v.group] === v.id : v.active;
            v.cssClass = v.active ? 'active' : '';
        }

        return tabs;
    }

    _createDragDropHandlers() {
        return this.options.dragDrop.map(d => {
            d.callbacks = {
                drop: this._onDrop.bind(this)
            };
            return new foundry.applications.ux.DragDrop.implementation(d);
        });
    }

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);
        htmlElement
            .querySelectorAll('.selection-checkbox')
            .forEach(element => element.addEventListener('change', this.selectionClick.bind(this)));
        this._dragDrop.forEach(d => d.bind(htmlElement));
    }

    static async updateForm(event, _, formData) {
        const { levelup } = foundry.utils.expandObject(formData.object);
        await this.levelup.updateSource(levelup);
        this.render();
    }

    async _onDrop(event) {
        const data = foundry.applications.ux.TextEditor.getDragEventData(event);
        const item = await fromUuid(data.uuid);
        if (event.currentTarget.parentElement?.classList?.contains('domain-cards')) {
            if (item.type === 'domainCard') {
                if (!this.actor.system.class.system.domains.includes(item.system.domain)) {
                    // Also needs to check for multiclass adding a new domain
                    ui.notifications.error(
                        game.i18n.localize('DAGGERHEART.Application.LevelUp.notifications.error.domainCardWrongDomain')
                    );
                    return;
                }

                if (item.system.level > Number(event.currentTarget.dataset.limit)) {
                    ui.notifications.error(
                        game.i18n.localize('DAGGERHEART.Application.LevelUp.notifications.error.domainCardToHighLevel')
                    );
                    return;
                }

                const achievementCard = event.currentTarget.dataset.path.startsWith('domainCards');
                await this.levelup.updateSource({ [event.currentTarget.dataset.path]: item.uuid });
                this.render();
            }
        }
    }

    async selectionClick(event) {
        event.stopPropagation();
        const button = event.currentTarget;

        // const advancementSelections = this.getAdvancementSelectionUpdates(button);
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
        await this.actor.levelUp(this.levelup.selectionData);

        this.close();
    }
}
