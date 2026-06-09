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

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        if (this.document.system.linkedClass) {
            const classData = await fromUuid(this.document.system.linkedClass);
            context.class = classData ?? {
                name: _loc('DAGGERHEART.GENERAL.missingX', { x: _loc('TYPES.Item.class') }),
                missing: true
            };
        }
        return context;
    }

    async _onDrop(event) {
        event.stopPropagation();
        const data = TextEditor.getDragEventData(event);
        const item = await fromUuid(data.uuid);
        const itemType = data.type === 'ActiveEffect' ? data.type : item.type;
        if (itemType === 'class') {
            const uuid = item.sourceUuid;
            if (this.document.system.linkedClass !== uuid) {
                await this.document.update({ 'system.linkedClass': uuid });
                // Re-render all class sheets for instant feedback
                for (const app of foundry.applications.instances.values()) {
                    if (app.document?.type === 'class') app.render();
                }
            }
            return;
        }

        return super._onDrop(event);
    }
}
