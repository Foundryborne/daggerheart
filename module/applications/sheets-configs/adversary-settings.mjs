import { DHDamageData } from '../../data/fields/action/damageField.mjs';
import DHBaseActorSettings from '../sheets/api/actor-setting.mjs';

/**@typedef {import('@client/applications/_types.mjs').ApplicationClickAction} ApplicationClickAction */

export default class DHAdversarySettings extends DHBaseActorSettings {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['adversary-settings'],
        position: { width: 455, height: 'auto' },
        actions: {
            addExperience: this.#onAddExperience,
            removeExperience: this.#onRemoveExperience,
            addDamage: this.#onAddDamage,
            removeDamage: this.#onRemoveDamage
        }
    };

    /**@override */
    static PARTS = {
        header: {
            id: 'header',
            template: 'systems/daggerheart/templates/sheets-settings/adversary-settings/header.hbs'
        },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        details: {
            id: 'details',
            template: 'systems/daggerheart/templates/sheets-settings/adversary-settings/details.hbs'
        },
        attack: {
            id: 'attack',
            template: 'systems/daggerheart/templates/sheets-settings/adversary-settings/attack.hbs'
        },
        experiences: {
            id: 'experiences',
            template: 'systems/daggerheart/templates/sheets-settings/adversary-settings/experiences.hbs'
        },
        features: {
            id: 'features',
            template: 'systems/daggerheart/templates/sheets-settings/adversary-settings/features.hbs',
            scrollable: ['']
        }
    };

    /** @override */
    static TABS = {
        primary: {
            tabs: [{ id: 'details' }, { id: 'attack' }, { id: 'experiences' }, { id: 'features' }],
            initial: 'details',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        // Get feature groups. Uncategorized go to actions
        const featureFormsTypes = ['passive', 'action', 'reaction'];
        const features = this.document.system.features.sort((a, b) => a.sort - b.sort);
        const featureGroups = featureFormsTypes.map(t => ({
            featureForm: t,
            label: _loc(CONFIG.DH.ITEM.featureForm[t]),
            features: features.filter(f => f.system.featureForm === t)
        }));
        featureGroups[1].features.push(...features.filter(f => !featureFormsTypes.includes(f.system.featureForm)));
        context.featureGroups = featureGroups;

        return context;
    }

    /* -------------------------------------------- */

    /**
     * Adds a new experience entry to the actor.
     * @type {ApplicationClickAction}
     */
    static async #onAddExperience() {
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
    static async #onRemoveExperience(_, target) {
        const experience = this.actor.system.experiences[target.dataset.experience];
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

        await this.actor.update({ [`system.experiences.${target.dataset.experience}`]: _del });
    }

    /**
     * @this DHAdversarySettings 
     * @type {ApplicationClickAction}
     */
    static #onAddDamage() {
        this.actor.update({
            'system.attack.damage.main': {
                ...DHDamageData.schema.getInitialValue(),
                applyTo: 'hitPoints',
                type: 'physical'
            }
        });
    }
    
    /**
     * @this DHAdversarySettings 
     * @type {ApplicationClickAction}
     */
    static #onRemoveDamage() {
        this.actor.update({
            'system.attack.damage.main': null
        });
    }
}
