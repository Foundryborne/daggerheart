import DHBaseActorSettings from '../sheets/api/actor-setting.mjs';

/**@typedef {import('@client/applications/_types.mjs').ApplicationClickAction} ApplicationClickAction */

export default class DHCharacterSettings extends DHBaseActorSettings {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['character-settings'],
        position: { width: 455, height: 'auto' },
        actions: {
            addExperience: DHCharacterSettings.#addExperience,
            removeExperience: DHCharacterSettings.#removeExperience
        },
        dragDrop: [
            { dragSelector: null, dropSelector: '.tab.features' },
            { dragSelector: '.feature-item', dropSelector: null }
        ]
    };

    /**@override */
    static PARTS = {
        header: {
            id: 'header',
            template: 'systems/daggerheart/templates/sheets-settings/character-settings/header.hbs'
        },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        details: {
            id: 'details',
            template: 'systems/daggerheart/templates/sheets-settings/character-settings/details.hbs'
        },
        experiences: {
            id: 'experiences',
            template: 'systems/daggerheart/templates/sheets-settings/character-settings/experiences.hbs'
        }
    };

    /** @override */
    static TABS = {
        primary: {
            tabs: [{ id: 'details' }, { id: 'experiences' }],
            initial: 'details',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    /**@inheritdoc */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.levelupAuto = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).levelupAuto;

        return context;
    }

    /* -------------------------------------------- */

    /**
     * Adds a new experience entry to the actor.
     * @type {ApplicationClickAction}
     */
    static async #addExperience() {
        const newExperience = {
            name: 'Experience',
            modifier: 0
        };
        await this.actor.update({ [`system.experiences.${foundry.utils.randomID()}`]: newExperience });
    }

    /**
     * Removes an experience entry from the actor.
     * @type {ApplicationClickAction}
     */
    static async #removeExperience(_, target) {
        const experience = this.actor.system.experiences[target.dataset.experience];
        const updates = {};

        const relinkAchievementData = [];
        const relinkSelectionData = [];
        Object.keys(this.actor.system.levelData.levelups).forEach(key => {
            const level = this.actor.system.levelData.levelups[key];

            const achievementIncludesExp = level.achievements.experiences[target.dataset.experience];
            if (achievementIncludesExp)
                relinkAchievementData.push({ levelKey: key, experience: target.dataset.experience });

            const selectionIndex = level.selections.findIndex(
                x => x.optionKey === 'experience' && x.data[0] === target.dataset.experience
            );
            if (selectionIndex !== -1)
                relinkSelectionData.push({ levelKey: key, selectionIndex, experience: target.dataset.experience });
        });

        if (relinkAchievementData.length > 0 || relinkSelectionData.length > 0) {
            const confirmed = await foundry.applications.api.DialogV2.confirm({
                window: {
                    title: game.i18n.localize('DAGGERHEART.ACTORS.Character.experienceDataRemoveConfirmation.title')
                },
                content: game.i18n.localize('DAGGERHEART.ACTORS.Character.experienceDataRemoveConfirmation.text')
            });
            if (!confirmed) return;
        }

        if (relinkAchievementData.length > 0) {
            relinkAchievementData.forEach(data => {
                updates[`system.levelData.levelups.${data.levelKey}.achievements.experiences.-=${data.experience}`] =
                    null;
            });
        } else if (relinkSelectionData.length > 0) {
            relinkSelectionData.forEach(data => {
                updates[`system.levelData.levelups.${data.levelKey}.selections`] = this.actor.system.levelData.levelups[
                    data.levelKey
                ].selections.reduce((acc, selection, index) => {
                    if (
                        index === data.selectionIndex &&
                        selection.optionKey === 'experience' &&
                        selection.data.includes(data.experience)
                    ) {
                        acc.push({ ...selection, data: selection.data.filter(x => x !== data.experience) });
                    } else {
                        acc.push(selection);
                    }

                    return acc;
                }, []);
            });
        } else {
            const confirmed = await foundry.applications.api.DialogV2.confirm({
                window: {
                    title: game.i18n.format('DAGGERHEART.APPLICATIONS.DeleteConfirmation.title', {
                        type: game.i18n.localize(`DAGGERHEART.GENERAL.Experience.single`),
                        name: experience.name
                    })
                },
                content: game.i18n.format('DAGGERHEART.APPLICATIONS.DeleteConfirmation.text', { name: experience.name })
            });
            if (!confirmed) return;
        }

        await this.actor.update({
            ...updates,
            [`system.experiences.-=${target.dataset.experience}`]: null
        });
    }
}
