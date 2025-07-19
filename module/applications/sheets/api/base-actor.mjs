import DHBaseActorSettings from './actor-setting.mjs';
import DHApplicationMixin from './application-mixin.mjs';

const { ActorSheetV2 } = foundry.applications.sheets;

/**@typedef {import('@client/applications/_types.mjs').ApplicationClickAction} ApplicationClickAction */

/**
 * A base actor sheet extending {@link ActorSheetV2} via {@link DHApplicationMixin}
 * @extends ActorSheetV2
 * @mixes DHSheetV2
 */
export default class DHBaseActorSheet extends DHApplicationMixin(ActorSheetV2) {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        classes: ['actor'],
        position: {
            width: 480
        },
        form: {
            submitOnChange: true
        },
        actions: {
            openSettings: DHBaseActorSheet.#openSettings,
            sendExpToChat: DHBaseActorSheet.#sendExpToChat,
        },
        contextMenus: [
            {
                handler: DHBaseActorSheet.#getFeatureContextOptions,
                selector: '[data-item-uuid][data-type="feature"]',
                options: {
                    parentClassHooks: false,
                    fixed: true
                }
            }
        ],
        dragDrop: [{ dragSelector: '.inventory-item[data-type="attack"]', dropSelector: null }]
    };

    /* -------------------------------------------- */

    /**@type {typeof DHBaseActorSettings}*/
    #settingSheet;

    /**@returns {DHBaseActorSettings|null} */
    get settingSheet() {
        const SheetClass = this.document.system.metadata.settingSheet;
        return (this.#settingSheet ??= SheetClass ? new SheetClass({ document: this.document }) : null);
    }

    /* -------------------------------------------- */
    /*  Prepare Context                             */
    /* -------------------------------------------- */

    /**@inheritdoc */
    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.isNPC = this.document.isNPC;
        return context;
    }


    /**@inheritdoc */
    async _preparePartContext(partId, context, options) {
        context = await super._preparePartContext(partId, context, options);
        switch (partId) {
            case 'effects':
                await this._prepareEffectsContext(context, options);
                break;
        }
        return context;
    }

    /**
     * Prepare render context for the Effect part.
     * @param {ApplicationRenderContext} context
     * @param {ApplicationRenderOptions} options
     * @returns {Promise<void>}
     * @protected
     */
    async _prepareEffectsContext(context, _options) {
        context.effects = {
            actives: [],
            inactives: [],
        };

        for (const effect of this.actor.allApplicableEffects()) {
            const list = effect.active ? context.effects.actives : context.effects.inactives;
            list.push(effect);
        }
    }

    /* -------------------------------------------- */
    /*  Context Menu                                */
    /* -------------------------------------------- */

    /**
     * Get the set of ContextMenu options for Features.
     * @returns {import('@client/applications/ux/context-menu.mjs').ContextMenuEntry[]} - The Array of context options passed to the ContextMenu instance
     * @this {DHSheetV2}
     * @protected
     */
    static #getFeatureContextOptions() {
        return this._getContextMenuCommonOptions.call(this, { usable: true, toChat: true });
    }


    /* -------------------------------------------- */
    /*  Application Clicks Actions                  */
    /* -------------------------------------------- */

    /**
     * Open the Actor Setting Sheet
     * @type {ApplicationClickAction}
     */
    static async #openSettings() {
        await this.settingSheet.render({ force: true });
    }

    /**
     * Send Experience to Chat
     * @type {ApplicationClickAction}
     */
    static async #sendExpToChat(_, button) {
        const experience = this.document.system.experiences[button.dataset.id];

        const systemData = {
            name: game.i18n.localize('DAGGERHEART.GENERAL.Experience.single'),
            description: `${experience.name} ${experience.value.signedString()}`
        };

        foundry.documents.ChatMessage.implementation.create({
            type: 'abilityUse',
            user: game.user.id,
            system: systemData,
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/ui/chat/ability-use.hbs',
                systemData
            )
        });
    }

    /* -------------------------------------------- */
    /*  Application Drag/Drop                       */
    /* -------------------------------------------- */

    /**
     * On dragStart on the item.
     * @param {DragEvent} event - The drag event
     */
    async _onDragStart(event) {
        const attackItem = event.currentTarget.closest('.inventory-item[data-type="attack"]');

        if (attackItem) {
            const attackData = {
                type: 'Attack',
                actorUuid: this.document.uuid,
                img: this.document.system.attack.img,
                fromInternal: true
            };
            event.dataTransfer.setData('text/plain', JSON.stringify(attackData));
            event.dataTransfer.setDragImage(attackItem.querySelector('img'), 60, 0);
        }
    }
}
