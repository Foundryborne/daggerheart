import DHBaseItemSheet from '../api/base-item.mjs';

export default class BeastformSheet extends DHBaseItemSheet {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['beastform'],
        dragDrop: [{ dragSelector: null, dropSelector: '.drop-section' }],
        actions: {
            editFeature: this.editFeature,
            removeFeature: this.removeFeature
        }
    };

    /**@override */
    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/items/beastform/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        settings: { template: 'systems/daggerheart/templates/sheets/items/beastform/settings.hbs' },
        features: {
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-features.hbs',
            scrollable: ['.features']
        },
        effects: {
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-effects.hbs',
            scrollable: ['.effects']
        }
    };

    static TABS = {
        primary: {
            tabs: [{ id: 'settings' }, { id: 'features' }, { id: 'effects' }],
            initial: 'settings',
            labelPrefix: 'DAGGERHEART.Sheets.TABS'
        }
    };

    /**@inheritdoc */
    async _preparePartContext(partId, context) {
        await super._preparePartContext(partId, context);

        return context;
    }

    static editFeature(event) {
        const target = event.target.closest('[data-action="editFeature"]');
        const feature = this.document.system.features[target.dataset.index];
        feature.sheet.render({ force: true });
    }

    static async removeFeature(_, target) {
        const current = this.document.system.features.map(x => x.uuid);
        await this.document.update({
            'system.features': current.filter((_, index) => index !== Number(target.dataset.index))
        });
    }

    async _onDrop(event) {
        const data = TextEditor.getDragEventData(event);
        const item = await fromUuid(data.uuid);
        if (item.type === 'feature') {
            const current = this.document.system.features.map(x => x.uuid);
            await this.document.update({ 'system.features': [...current, item.uuid] });
        }
    }
}
