import DHBaseActorSheet from '../api/base-actor.mjs';

export default class NPCSheet extends DHBaseActorSheet {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        classes: ['npc'],
        position: { width: 660, height: 600 },
        window: { resizable: true },
        actions: {},
        window: {
            resizable: true,
            controls: [
                {
                    icon: 'fa-solid fa-signature',
                    label: 'DAGGERHEART.UI.Tooltip.configureAttribution',
                    action: 'editAttribution'
                }
            ]
        },
        dragDrop: [
            {
                dragSelector: '[data-item-id][draggable="true"], [data-item-id] [draggable="true"]',
                dropSelector: null
            }
        ]
    };

    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/actors/npc/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/actors/npc/navigation.hbs' },
        features: {
            template: 'systems/daggerheart/templates/sheets/actors/npc/features.hbs',
            scrollable: ['.feature-section']
        },
        notes: {
            template: 'systems/daggerheart/templates/sheets/actors/npc/notes.hbs'
        }
    };

    /** @inheritdoc */
    static TABS = {
        primary: {
            tabs: [{ id: 'notes' }, { id: 'features' }],
            initial: 'notes',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    /** @inheritdoc */
    _prepareTabs(group) {
        const result = super._prepareTabs(group);
        if (group === 'primary') {
            result.features.empty = this.document.system.features.length === 0;
        }
        return result;
    }

    /** @inheritdoc */
    async _preparePartContext(partId, context, options) {
        context = await super._preparePartContext(partId, context, options);
        switch (partId) {
            case 'header':
                await this._prepareHeaderContext(context, options);
                break;
            case 'features':
                await this._prepareFeaturesContext(context, options);
                break;
            case 'notes':
                await this._prepareNotesContext(context, options);
                break;
        }

        return context;
    }

    /**
     * Prepare render context for the Header part.
     * @param {ApplicationRenderContext} context
     * @param {ApplicationRenderOptions} options
     * @returns {Promise<void>}
     * @protected
     */
    async _prepareHeaderContext(context, _options) {
        const { system } = this.document;
        const { TextEditor } = foundry.applications.ux;

        context.description = await TextEditor.implementation.enrichHTML(system.description, {
            secrets: this.document.isOwner,
            relativeTo: this.document
        });
    }

    /**
     * Prepare render context for the Features part.
     * @param {ApplicationRenderContext} context
     * @param {ApplicationRenderOptions} options
     * @returns {Promise<void>}
     * @protected
     */
    async _prepareFeaturesContext(context, _options) {
        const featureForms = ['passive', 'action', 'reaction'];
        context.features = this.document.system.features.sort((a, b) =>
            a.system.featureForm !== b.system.featureForm
                ? featureForms.indexOf(a.system.featureForm) - featureForms.indexOf(b.system.featureForm)
                : a.sort - b.sort
        );
    }

    /**
     * Prepare render context for the Biography part.
     * @param {ApplicationRenderContext} context
     * @param {ApplicationRenderOptions} options
     * @returns {Promise<void>}
     * @protected
     */
    async _prepareNotesContext(context, _options) {
        const { system } = this.document;
        const { TextEditor } = foundry.applications.ux;

        const paths = {
            notes: 'notes'
        };

        for (const [key, path] of Object.entries(paths)) {
            const value = foundry.utils.getProperty(system, path);
            context[key] = {
                field: system.schema.getField(path),
                value,
                enriched: await TextEditor.implementation.enrichHTML(value, {
                    secrets: this.document.isOwner,
                    relativeTo: this.document
                })
            };
        }
    }
}
