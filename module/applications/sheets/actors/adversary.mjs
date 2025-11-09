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
            reactionRoll: AdversarySheet.#reactionRoll,
            toggleResourceDice: AdversarySheet.#toggleResourceDice,
            handleResourceDice: AdversarySheet.#handleResourceDice
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
        limited: {
            template: 'systems/daggerheart/templates/sheets/actors/adversary/limited.hbs',
            scrollable: ['.limited-container']
        },
        sidebar: {
            template: 'systems/daggerheart/templates/sheets/actors/adversary/sidebar.hbs',
            scrollable: ['.shortcut-items-section']
        },
        header: { template: 'systems/daggerheart/templates/sheets/actors/adversary/header.hbs' },
        features: {
            template: 'systems/daggerheart/templates/sheets/actors/adversary/features.hbs',
            scrollable: ['.feature-section']
        },
        notes: {
            template: 'systems/daggerheart/templates/sheets/actors/adversary/notes.hbs'
        },
        effects: {
            template: 'systems/daggerheart/templates/sheets/actors/adversary/effects.hbs',
            scrollable: ['.effects-sections']
        }
    };

    /** @inheritdoc */
    static TABS = {
        primary: {
            tabs: [{ id: 'features' }, { id: 'effects' }, { id: 'notes' }],
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
            case 'limited':
                await this._prepareHeaderContext(context, options);

                const adversaryTypes = CONFIG.DH.ACTOR.allAdversaryTypes();
                context.adversaryType = game.i18n.localize(adversaryTypes[this.document.system.type].label);
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
                type: 'trait'
            },
            actionType: 'reaction',
            hasRoll: true,
            data: this.actor.getRollData()
        };

        this.actor.diceRoll(config);
    }

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
