import DHHeritageSheet from '../api/heritage-sheet.mjs';

export default class AncestrySheet extends DHHeritageSheet {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['ancestry'],
        actions: {
            addFeature: AncestrySheet.#addFeature,
            editFeature: AncestrySheet.#editFeature,
            removeFeature: AncestrySheet.#removeFeature
        },
        dragDrop: [{ dragSelector: null, dropSelector: '.tab.features .drop-section' }]
    };

    /**@inheritdoc */
    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/items/ancestry/header.hbs' },
        ...super.PARTS,
        features: { template: 'systems/daggerheart/templates/sheets/items/ancestry/features.hbs' }
    };

    async _preparePartContext(partId, context) {
        await super._preparePartContext(partId, context);

        switch (partId) {
            case 'features':
                context.primaryFeature = this.document.system.features.find(x => x.primary)?.value;
                context.secondaryFeature = this.document.system.features.find(x => !x.primary)?.value;
                break;
        }

        return context;
    }

    /* -------------------------------------------- */
    /*  Application Clicks Actions                  */
    /* -------------------------------------------- */

    /**
     * Add a new feature to the item, prompting the user for its type.
     * @type {ApplicationClickAction}
     */
    static async #addFeature(_event, button) {
        const feature = await game.items.documentClass.create({
            type: 'feature',
            name: game.i18n.format('DOCUMENT.New', { type: game.i18n.localize('TYPES.Item.feature') })
        });

        await this.document.update({
            system: {
                features: [
                    ...this.document.system.features.map(x => ({ ...x, value: x.value.uuid })),
                    { primary: button.dataset.type === 'primary', value: feature.uuid }
                ]
            }
        });
    }

    /**
     * Edit an existing feature on the item
     * @type {ApplicationClickAction}
     */
    static async #editFeature(_event, button) {
        const target = button.closest('.feature-item');
        const feature = this.document.system.features.find(x =>
            target.dataset.type === 'primary' ? x.primary : !x.primary
        )?.value;
        if (!feature) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.featureIsMissing'));
            return;
        }

        feature.sheet.render(true);
    }

    /**
     * Remove a feature from the item.
     * @type {ApplicationClickAction}
     */
    static async #removeFeature(event, button) {
        event.stopPropagation();
        const target = button.closest('.feature-item');
        const feature = this.document.system.features.find(x =>
            target.dataset.type === 'primary' ? x.primary : !x.primary
        )?.value;

        if (feature) {
            const confirmed = await foundry.applications.api.DialogV2.confirm({
                window: {
                    title: game.i18n.format('DAGGERHEART.APPLICATIONS.DeleteConfirmation.title', {
                        type: game.i18n.localize(`TYPES.Item.feature`),
                        name: feature.name
                    })
                },
                content: game.i18n.format('DAGGERHEART.APPLICATIONS.DeleteConfirmation.text', { name: feature.name })
            });
            if (!confirmed) return;
        }

        await this.document.update({
            'system.features': this.document.system.features
                .filter(x => x.value.uuid !== feature.uuid)
                .map(x => ({ ...x, value: x.value.uuid }))
        });
    }

    /* -------------------------------------------- */
    /*  Application Drag/Drop                       */
    /* -------------------------------------------- */

    /**
     * On drop on the item.
     * @param {DragEvent} event - The drag event
     */
    async _onDrop(event) {
        event.stopPropagation();
        event.preventDefault();

        const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);

        const item = await fromUuid(data.uuid);
        if (item?.type === 'feature') {
            await this.document.update({
                'system.features': [
                    ...this.document.system.features.map(x => ({ ...x, value: x.value.uuid })),
                    { primary: Boolean(event.target.closest('.primary-feature')), value: item.uuid }
                ]
            });
        }
    }
}
