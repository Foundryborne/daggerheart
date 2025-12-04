import { getDocFromElement } from '../../../helpers/utils.mjs';
import DHBaseActorSheet from '../api/base-actor.mjs';

/**@typedef {import('@client/applications/_types.mjs').ApplicationClickAction} ApplicationClickAction */

export default class DhpEnvironment extends DHBaseActorSheet {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        classes: ['environment'],
        position: {
            width: 500,
            height: 740
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
        },
        actions: {
            toggleResourceDice: DhpEnvironment.#toggleResourceDice,
            handleResourceDice: DhpEnvironment.#handleResourceDice
        },
        dragDrop: [{ dragSelector: '.inventory-item', dropSelector: null }]
    };

    /**@override */
    static PARTS = {
        limited: {
            template: 'systems/daggerheart/templates/sheets/actors/environment/limited.hbs',
            scrollable: ['.limited-container']
        },
        header: { template: 'systems/daggerheart/templates/sheets/actors/environment/header.hbs' },
        features: {
            template: 'systems/daggerheart/templates/sheets/actors/environment/features.hbs',
            scrollable: ['.feature-section']
        },
        potentialAdversaries: {
            template: 'systems/daggerheart/templates/sheets/actors/environment/potentialAdversaries.hbs',
            scrollable: ['.items-section']
        },
        notes: { template: 'systems/daggerheart/templates/sheets/actors/environment/notes.hbs' }
    };

    /** @inheritdoc */
    static TABS = {
        primary: {
            tabs: [{ id: 'features' }, { id: 'potentialAdversaries' }, { id: 'notes' }],
            initial: 'features',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    /**  @inheritdoc */
    _initializeApplicationOptions(options) {
        const applicationOptions = super._initializeApplicationOptions(options);

        if (applicationOptions.document.testUserPermission(game.user, 'LIMITED', { exact: true })) {
            applicationOptions.position.width = 360;
            applicationOptions.position.height = 'auto';
        }

        return applicationOptions;
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

    async _onDragStart(event) {
        const item = event.currentTarget.closest('.inventory-item');

        if (item) {
            const adversaryData = { type: 'Actor', uuid: item.dataset.itemUuid };
            event.dataTransfer.setData('text/plain', JSON.stringify(adversaryData));
            event.dataTransfer.setDragImage(item, 60, 0);
        }
    }

    /* -------------------------------------------- */
    /*  Application Clicks Actions                  */
    /* -------------------------------------------- */

    /**
     * Toggle the used state of a resource dice.
     * @type {ApplicationClickAction}
     */
    static async #toggleResourceDice(event, target) {
        const item = await getDocFromElement(target);

        const { dice } = event.target.closest('.item-resource').dataset;
        const diceState = item.system.resource.diceStates[dice];

        await item.update({
            [`system.resource.diceStates.${dice}.used`]: diceState ? !diceState.used : true
        });
    }

    /**
     * Handle the roll values of resource dice.
     * @type {ApplicationClickAction}
     */
    static async #handleResourceDice(_, target) {
        const item = await getDocFromElement(target);
        if (!item) return;

        const rollValues = await game.system.api.applications.dialogs.ResourceDiceDialog.create(item, this.document);
        if (!rollValues) return;

        await item.update({
            'system.resource.diceStates': rollValues.reduce((acc, state, index) => {
                acc[index] = { value: state.value, used: state.used };
                return acc;
            }, {})
        });
    }
}
