import DHBaseActorSettings from '../sheets/api/actor-setting.mjs';

/**@typedef {import('@client/applications/_types.mjs').ApplicationClickAction} ApplicationClickAction */

export default class DHNPCSettings extends DHBaseActorSettings {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['npc-settings'],
        position: { width: 455, height: 'auto' },
        actions: {},
        dragDrop: [
            { dragSelector: null, dropSelector: '.tab.features' },
            { dragSelector: '.feature-item', dropSelector: null }
        ]
    };

    /**@override */
    static PARTS = {
        header: {
            id: 'header',
            template: 'systems/daggerheart/templates/sheets-settings/npc-settings/header.hbs'
        },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        details: {
            id: 'details',
            template: 'systems/daggerheart/templates/sheets-settings/npc-settings/details.hbs'
        },
        features: {
            id: 'features',
            template: 'systems/daggerheart/templates/sheets-settings/npc-settings/features.hbs'
        }
    };

    /** @override */
    static TABS = {
        primary: {
            tabs: [{ id: 'details' }, { id: 'features' }],
            initial: 'details',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        const featureForms = ['passive', 'action', 'reaction'];
        context.features = context.document.system.features.sort((a, b) =>
            a.system.featureForm !== b.system.featureForm
                ? featureForms.indexOf(a.system.featureForm) - featureForms.indexOf(b.system.featureForm)
                : a.sort - b.sort
        );

        return context;
    }

    /* -------------------------------------------- */

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
        event.stopPropagation();
        const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);

        const item = await fromUuid(data.uuid);
        if (item?.type === 'feature') {
            if (data.fromInternal && item.parent?.uuid === this.actor.uuid) {
                return;
            }

            const itemData = item.toObject();
            delete itemData._id;

            await this.actor.createEmbeddedDocuments('Item', [itemData]);
        }
    }
}
