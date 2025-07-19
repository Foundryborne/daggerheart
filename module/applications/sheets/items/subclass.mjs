import DHBaseItemSheet from '../api/base-item.mjs';

export default class SubclassSheet extends DHBaseItemSheet {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['subclass'],
        position: { width: 600 },
        window: { resizable: false },
        actions: {}
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
        },
        effects: {
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-effects.hbs',
            scrollable: ['.effects']
        }
    };

    /** @inheritdoc */
    static TABS = {
        primary: {
            tabs: [{ id: 'description' }, { id: 'features' }, { id: 'settings' }, { id: 'effects' }],
            initial: 'description',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

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
        event.stopPropagation();

        const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
        if (data.fromInternal) return;

        const item = await fromUuid(data.uuid);
        const target = event.target.closest('fieldset.drop-section');
        if (item.type === 'feature') {
            if (target.dataset.type === 'foundation') {
                if (item.system.subType && item.system.subType !== CONFIG.DH.ITEM.featureSubTypes.foundation) {
                    ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.featureNotFoundation'));
                    return;
                }

                await item.update({ 'system.subType': CONFIG.DH.ITEM.featureSubTypes.foundation });
                await this.document.update({
                    'system.features': [...this.document.system.features.map(x => x.uuid), item.uuid]
                });
            } else if (target.dataset.type === 'specialization') {
                if (item.system.subType && item.system.subType !== CONFIG.DH.ITEM.featureSubTypes.specialization) {
                    ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.featureNotSpecialization'));
                    return;
                }

                await item.update({ 'system.subType': CONFIG.DH.ITEM.featureSubTypes.specialization });
                await this.document.update({
                    'system.features': [...this.document.system.features.map(x => x.uuid), item.uuid]
                });
            } else if (target.dataset.type === 'mastery') {
                if (item.system.subType && item.system.subType !== CONFIG.DH.ITEM.featureSubTypes.mastery) {
                    ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.featureNotMastery'));
                    return;
                }

                await item.update({ 'system.subType': CONFIG.DH.ITEM.featureSubTypes.mastery });
                await this.document.update({
                    'system.features': [...this.document.system.features.map(x => x.uuid), item.uuid]
                });
            }
        }
    }
}
