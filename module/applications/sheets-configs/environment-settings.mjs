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
            { dragSelector: '.feature-item', dropSelector: null }
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
            template: 'systems/daggerheart/templates/sheets-settings/environment-settings/features.hbs'
        },
        adversaries: {
            id: 'adversaries',
            template: 'systems/daggerheart/templates/sheets-settings/environment-settings/adversaries.hbs'
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

    /**
     *  Adds a new category entry to the actor.
     * @type {ApplicationClickAction}
     */
    static async #addCategory() {
        await this.actor.update({
            [`system.potentialAdversaries.${foundry.utils.randomID()}.label`]: game.i18n.localize(
                'DAGGERHEART.ACTORS.Environment.newAdversary'
            )
        });
    }

    /**
     * Removes an category entry from the actor.
     * @type {ApplicationClickAction}
     */
    static async #removeCategory(_, target) {
        await this.actor.update({ [`system.potentialAdversaries.-=${target.dataset.categoryId}`]: null });
    }

    /**
     * 
     * @type {ApplicationClickAction}
     * @returns 
     */
    static async #deleteAdversary(_event, target) {
        const doc = getDocFromElement(target);
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
        await this.actor.update({ [path]: newAdversaries });
    }

    async _onDragStart(event) {
        const featureItem = event.currentTarget.closest('.feature-item');

        if (featureItem) {
            const feature = this.actor.items.get(featureItem.id);
            const featureData = { type: 'Item', uuid: feature.uuid, fromInternal: true };
            event.dataTransfer.setData('text/plain', JSON.stringify(featureData));
            event.dataTransfer.setDragImage(featureItem.querySelector('img'), 60, 0);
        }
    }

    async _onDrop(event) {
        const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
        if (data.fromInternal) return;

        const item = await fromUuid(data.uuid);
        if (item.type === 'adversary' && event.target.closest('.category-container')) {
            const target = event.target.closest('.category-container');
            const path = `system.potentialAdversaries.${target.dataset.potentialAdversary}.adversaries`;
            const current = foundry.utils.getProperty(this.actor, path).map(x => x.uuid);
            await this.actor.update({
                [path]: [...current, item.uuid]
            });
            this.render();
        } else if (item.type === 'feature' && event.target.closest('.tab.features')) {
            await this.actor.createEmbeddedDocuments('Item', [item]);
            this.render();
        }
    }
}
