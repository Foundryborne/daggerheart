import DHBaseItemSheet from '../api/base-item.mjs';

export default class SubclassSheet extends DHBaseItemSheet {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['subclass'],
        position: { width: 600 },
        window: { resizable: false },
        actions: {
            addFeature: this.addFeature,
            editFeature: this.editFeature,
            deleteFeature: this.deleteFeature
        }
    };

    /**@override */
    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/items/subclass/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        description: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-description.hbs' },
        features: {
            template: 'systems/daggerheart/templates/sheets/items/subclass/features.hbs',
            scrollable: ['.features']
        },
        settings: {
            template: 'systems/daggerheart/templates/sheets/items/subclass/settings.hbs',
            scrollable: ['.settings']
        }
    };

    /** @inheritdoc */
    static TABS = {
        primary: {
            tabs: [{ id: 'description' }, { id: 'features' }, { id: 'settings' }],
            initial: 'description',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    static async addFeature(_, target) {
        const feature = await game.items.documentClass.create({
            type: 'feature',
            name: game.i18n.format('DOCUMENT.New', { type: game.i18n.localize('TYPES.Item.feature') })
        });
        await this.document.update({
            [`system.${target.dataset.type}`]: feature.uuid
        });
    }

    static async editFeature(_, button) {
        const feature = this.document.system[button.dataset.type];
        if (!feature) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.featureIsMissing'));
            return;
        }

        feature.sheet.render(true);
    }

    static async deleteFeature(event, button) {
        event.stopPropagation();

        await this.document.update({
            [`system.${button.dataset.type}`]: null
        });
    }

    async _onDragStart(event) {
        const featureItem = event.currentTarget.closest('.drop-section');

        if (featureItem) {
            const feature = this.document.system[featureItem.dataset.type];
            if (!feature) {
                ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.featureIsMissing'));
                return;
            }

            const featureData = { type: 'Item', data: { ...feature.toObject(), _id: null }, fromInternal: true };
            event.dataTransfer.setData('text/plain', JSON.stringify(featureData));
            event.dataTransfer.setDragImage(featureItem.querySelector('img'), 60, 0);
        }
    }

    async _onDrop(event) {
        const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
        if (data.fromInternal) return;

        const item = await fromUuid(data.uuid);
        if (item?.type === 'feature') {
            const dropSection = event.target.closest('.drop-section');
            if (this.document.system[dropSection.dataset.type]) {
                ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.notifications.featureIsFull'));
                return;
            }

            await this.document.update({ [`system.${dropSection.dataset.type}`]: item.uuid });
        }
    }
}
