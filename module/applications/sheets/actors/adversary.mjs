import { getDocFromElement } from '../../../helpers/utils.mjs';
import DHBaseActorSheet from '../api/base-actor.mjs';

/**@typedef {import('@client/applications/_types.mjs').ApplicationClickAction} ApplicationClickAction */

export default class AdversarySheet extends DHBaseActorSheet {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        classes: ['adversary'],
        position: { width: 660, height: 766 },
        window: { resizable: true },
        actions: {
            reactionRoll: AdversarySheet.#reactionRoll
        },
        window: {
            resizable: true,
            controls: [
                {
                    icon: 'fa-solid fa-signature',
                    label: 'DAGGERHEART.UI.Tooltip.configureAttribution',
                    action: 'editAttribution'
                }
            ]
        }
    };

    static PARTS = {
        sidebar: { template: 'systems/daggerheart/templates/sheets/actors/adversary/sidebar.hbs' },
        header: { template: 'systems/daggerheart/templates/sheets/actors/adversary/header.hbs' },
        features: { template: 'systems/daggerheart/templates/sheets/actors/adversary/features.hbs' },
        notes: { template: 'systems/daggerheart/templates/sheets/actors/adversary/notes.hbs' },
        effects: { template: 'systems/daggerheart/templates/sheets/actors/adversary/effects.hbs' }
    };

    /** @inheritdoc */
    static TABS = {
        primary: {
            tabs: [{ id: 'features' }, { id: 'effects' }, { id: 'notes' }],
            initial: 'features',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    /**@inheritdoc */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.systemFields.attack.fields = this.document.system.attack.schema.fields;
        return context;
    }

    /**@inheritdoc */
    async _preparePartContext(partId, context, options) {
        context = await super._preparePartContext(partId, context, options);
        switch (partId) {
            case 'header':
                await this._prepareHeaderContext(context, options);
                break;
            case 'notes':
                await this._prepareNotesContext(context, options);
                break;
        }
        return context;
    }

    /**@inheritdoc */
    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        htmlElement.querySelectorAll('.inventory-item-resource').forEach(element => {
            element.addEventListener('change', this.updateItemResource.bind(this));
            element.addEventListener('click', e => e.stopPropagation());
        });
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

    /* -------------------------------------------- */
    /*  Application Clicks Actions                  */
    /* -------------------------------------------- */

    /**
     * Performs a reaction roll for an Adversary.
     * @type {ApplicationClickAction}
     */
    static #reactionRoll(event) {
        const config = {
            event,
            title: `Reaction Roll: ${this.actor.name}`,
            headerTitle: 'Adversary Reaction Roll',
            roll: {
                type: 'reaction'
            },
            type: 'trait',
            hasRoll: true,
            data: this.actor.getRollData()
        };

        this.actor.diceRoll(config);
    }

    /* -------------------------------------------- */
    /*  Application Listener Actions                */
    /* -------------------------------------------- */

    async updateItemResource(event) {
        const item = await getDocFromElement(event.currentTarget);
        if (!item) return;

        const max = event.currentTarget.max ? Number(event.currentTarget.max) : null;
        const value = max ? Math.min(Number(event.currentTarget.value), max) : event.currentTarget.value;
        await item.update({ 'system.resource.value': value });
        this.render();
    }
}
