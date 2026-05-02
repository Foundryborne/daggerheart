import DHBaseItemSheet from '../api/base-item.mjs';

export default class SubclassSheet extends DHBaseItemSheet {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['subclass'],
        position: { width: 600 },
        window: { resizable: true }
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

    /**@inheritdoc */
    get relatedDocs() {
        return this.document.system.features.map(x => x.item);
    }

    async _onDrop(event) {
        event.stopPropagation();
        const data = TextEditor.getDragEventData(event);
        const item = await fromUuid(data.uuid);
        const itemType = data.type === 'ActiveEffect' ? data.type : item.type;
        if (itemType === 'class') {
            const identifier = item.system.identifier;
            if (!identifier) {
                return ui.notifications.error(
                    game.i18n.localize('DAGGERHEART.UI.Notifications.classMissingIdentifier')
                );
            }

            if (this.document.system.classLink.identifier !== identifier) {
                const { img, name } = item;
                await this.document.update({ 'system.classLink': { identifier, img, name } });
            }
            return;
        }

        return super._onDrop(event);
    }
}
