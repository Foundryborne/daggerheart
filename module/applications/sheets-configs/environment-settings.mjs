import { getDocFromElement } from '../../helpers/utils.mjs';
import DHBaseActorSettings from '../sheets/api/actor-setting.mjs';

/**@typedef {import('@client/applications/_types.mjs').ApplicationClickAction} ApplicationClickAction */

export default class DHEnvironmentSettings extends DHBaseActorSettings {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['environment-settings'],
        actions: {
            addCategory: DHEnvironmentSettings.#addCategory,
            removeCategory: DHEnvironmentSettings.#removeCategory,
            deleteAdversary: DHEnvironmentSettings.#deleteAdversary
        },
        dragDrop: [
            { dragSelector: null, dropSelector: '.category-container' },
            { dragSelector: null, dropSelector: '.tab.features' },
            { dragSelector: '.feature-item, .inventory-item[data-type="adversary"]', dropSelector: null }
        ]
    };

    /**@override */
    static PARTS = {
        header: {
            id: 'header',
            template: 'systems/daggerheart/templates/sheets-settings/environment-settings/header.hbs'
        },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        details: {
            id: 'details',
            template: 'systems/daggerheart/templates/sheets-settings/environment-settings/details.hbs'
        },
        features: {
            id: 'features',
            template: 'systems/daggerheart/templates/sheets-settings/environment-settings/features.hbs',
            scrollable: ['']
        },
        adversaries: {
            id: 'adversaries',
            template: 'systems/daggerheart/templates/sheets-settings/environment-settings/adversaries.hbs',
            scrollable: ['']
        }
    };

    /** @inheritdoc */
    static TABS = {
        primary: {
            tabs: [{ id: 'details' }, { id: 'features' }, { id: 'adversaries' }],
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

    /**
     *  Adds a new category entry to the actor.
     * @type {ApplicationClickAction}
     */
    static async #addCategory() {
        await this.actor.update({
            [`system.potentialAdversaries.${foundry.utils.randomID()}`]: {
                label: game.i18n.localize('DAGGERHEART.ACTORS.Environment.newAdversary')
            }
        });
    }

    /**
     * Removes an category entry from the actor.
     * @type {ApplicationClickAction}
     */
    static async #removeCategory(_, target) {
        await this.actor.update({ [`system.potentialAdversaries.${target.dataset.categoryId}`]: _del });
    }

    /**
     *
     * @type {ApplicationClickAction}
     * @returns
     */
    static async #deleteAdversary(_event, target) {
        const doc = await getDocFromElement(target);
        const { category } = target.dataset;
        const path = `system.potentialAdversaries.${category}.adversaries`;

        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: {
                title: game.i18n.format('DAGGERHEART.APPLICATIONS.DeleteConfirmation.title', {
                    type: game.i18n.localize('TYPES.Actor.adversary'),
                    name: doc.name
                })
            },
            content: game.i18n.format('DAGGERHEART.APPLICATIONS.DeleteConfirmation.text', { name: doc.name })
        });

        if (!confirmed) return;

        const adversaries = foundry.utils.getProperty(this.actor, path);
        const newAdversaries = adversaries.filter(a => a.uuid !== doc.uuid);
        await this.actor.update({ [path]: newAdversaries.map(x => x.uuid) });
    }

    async _onDragStart(event) {
        const element = event.currentTarget.closest('.inventory-item[data-type=adversary]');
        if (element) {
            const adversaryData = { type: 'Actor', uuid: element.dataset.itemUuid };
            event.dataTransfer.setData('text/plain', JSON.stringify(adversaryData));
            event.dataTransfer.setDragImage(element, 60, 0);
        } else {
            return super._onDragStart(event);
        }
    }

    async _onDrop(event) {
        event.stopPropagation();
        const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
        const doc = await fromUuid(data.uuid);
        if (doc?.type === 'adversary' && event.target.closest('.category-container')) {
            const target = event.target.closest('.category-container');
            const path = `system.potentialAdversaries.${target.dataset.potentialAdversary}.adversaries`;
            const current = foundry.utils.getProperty(this.actor, path).map(x => x.uuid);
            if (!current.includes(doc.uuid)) {
                await this.actor.update({ [path]: [...current, doc.uuid] });
            }
            return;
        }
        
        return super._onDrop(event);
    }
}
