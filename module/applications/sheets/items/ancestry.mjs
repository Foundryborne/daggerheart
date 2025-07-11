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
            name: game.i18n.format('DOCUMENT.New', { type: game.i18n.localize('TYPES.Item.feature') }),
            system: {
                subType: button.dataset.type
            }
        });
        await this.document.update({
            'system.features': [...this.document.system.features.map(x => x.uuid), feature.uuid]
        });
    }

    /**
     * Edit an existing feature on the item
     * @type {ApplicationClickAction}
     */
    static async #editFeature(_event, button) {
        const target = button.closest('.feature-item');
        const feature = this.document.system[`${target.dataset.type}Feature`];
        if (!feature || Object.keys(feature).length === 0) {
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
        const feature = this.document.system[`${target.dataset.type}Feature`];
        const featureExists = feature && Object.keys(feature).length > 0;

        if (featureExists) {
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

        if (featureExists && target.dataset.type === 'primary') await feature.update({ 'system.primary': null });
        await this.document.update({
            'system.features': this.document.system.features.filter(x => x && x.uuid !== feature.uuid).map(x => x.uuid)
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
            const subType = event.target.closest('.primary-feature') ? 'primary' : 'secondary';
            await item.update({ 'system.subType': subType });

            await this.document.update({
                'system.features': [...this.document.system.features.map(x => x.uuid), item.uuid]
            });
        }
    }
}
