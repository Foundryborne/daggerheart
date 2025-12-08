import { getDocFromElement, itemIsIdentical } from '../../../helpers/utils.mjs';
import DHBaseActorSettings from './actor-setting.mjs';
import DHApplicationMixin from './application-mixin.mjs';

const { ActorSheetV2 } = foundry.applications.sheets;

/**@typedef {import('@client/applications/_types.mjs').ApplicationClickAction} ApplicationClickAction */

/**
 * A base actor sheet extending {@link ActorSheetV2} via {@link DHApplicationMixin}
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
            increaseActionUses: event => DHBaseActorSheet.#modifyActionUses(event, true)
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

    get isVisible() {
        const viewPermission = this.document.testUserPermission(game.user, this.options.viewPermission);
        const limitedOnly = this.document.testUserPermission(game.user, this.options.viewPermission, { exact: true });
        return limitedOnly ? this.document.system.metadata.hasLimitedView : viewPermission;
    }

    /* -------------------------------------------- */
    /*  Prepare Context                             */
    /* -------------------------------------------- */

    /**@inheritdoc */
    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.isNPC = this.document.isNPC;
        context.useResourcePips = game.settings.get(
            CONFIG.DH.id,
            CONFIG.DH.SETTINGS.gameSettings.appearance
        ).useResourcePips;
        context.showAttribution = !game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.appearance)
            .hideAttribution;

        // Prepare inventory data
        if (['party', 'character'].includes(this.document.type)) {
            context.inventory = {
                currencies: {},
                weapons: this.document.itemTypes.weapon.sort((a, b) => a.sort - b.sort),
                armor: this.document.itemTypes.armor.sort((a, b) => a.sort - b.sort),
                consumables: this.document.itemTypes.consumable.sort((a, b) => a.sort - b.sort),
                loot: this.document.itemTypes.loot.sort((a, b) => a.sort - b.sort)
            };
            const { title, ...currencies } = game.settings.get(
                CONFIG.DH.id,
                CONFIG.DH.SETTINGS.gameSettings.Homebrew
            ).currency;
            for (const key in currencies) {
                context.inventory.currencies[key] = {
                    ...currencies[key],
                    field: context.systemFields.gold.fields[key],
                    value: context.source.system.gold[key]
                };
            }
            context.inventory.hasCurrency = Object.values(context.inventory.currencies).some((c) => c.enabled);
        }

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

    _configureRenderParts(options) {
        const parts = super._configureRenderParts(options);
        if (!this.document.system.metadata.hasLimitedView) return parts;

        if (this.document.testUserPermission(game.user, 'LIMITED', { exact: true })) return { limited: parts.limited };

        return Object.keys(parts).reduce((acc, key) => {
            if (key !== 'limited') acc[key] = parts[key];

            return acc;
        }, {});
    }

    /** @inheritDoc */
    async _onRender(context, options) {
        await super._onRender(context, options);

        if (
            this.document.system.metadata.hasLimitedView &&
            this.document.testUserPermission(game.user, 'LIMITED', { exact: true })
        ) {
            this.element.classList = `${this.element.classList} limited`;
        }
    }

    /**@inheritdoc */
    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        htmlElement.querySelectorAll('.inventory-item-quantity').forEach(element => {
            element.addEventListener('change', this.updateItemQuantity.bind(this));
            element.addEventListener('click', e => e.stopPropagation());
        });
        htmlElement.querySelectorAll('.item-button .action-uses-button').forEach(element => {
            element.addEventListener('contextmenu', DHBaseActorSheet.#modifyActionUses);
        });
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
            inactives: []
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
     * @this {DHBaseActorSheet}
     * @protected
     */
    static #getFeatureContextOptions() {
        return this._getContextMenuCommonOptions.call(this, { usable: true, toChat: true });
    }

    /* -------------------------------------------- */
    /*  Application Listener Actions                */
    /* -------------------------------------------- */

    async updateItemQuantity(event) {
        const item = await getDocFromElement(event.currentTarget);
        await item?.update({ 'system.quantity': event.currentTarget.value });
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
        const cls = getDocumentClass('ChatMessage');

        const systemData = {
            actor: { name: this.actor.name, img: this.actor.img },
            author: game.users.get(game.user.id),
            action: {
                name: `${experience.name} ${experience.value.signedString()}`,
                img: '/icons/sundries/misc/admission-ticket-blue.webp'
            },
            itemOrigin: {
                name: game.i18n.localize('DAGGERHEART.GENERAL.Experience.single')
            },
            description: experience.description
        };

        const msg = {
            user: game.user.id,
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/ui/chat/action.hbs',
                systemData
            ),
            title: game.i18n.localize('DAGGERHEART.ACTIONS.Config.displayInChat'),
            speaker: cls.getSpeaker(),
            flags: {
                daggerheart: {
                    cssClass: 'dh-chat-message dh-style'
                }
            }
        };

        cls.create(msg);
    }

    /**
     *
     */
    static async #modifyActionUses(event, increase) {
        event.stopPropagation();
        event.preventDefault();
        const actionId = event.target.dataset.itemUuid;
        const action = await foundry.utils.fromUuid(actionId);

        const newValue = (action.uses.value ?? 0) + (increase ? 1 : -1);
        await action.update({ 'uses.value': Math.min(Math.max(newValue, 0), action.uses.max ?? 0) });
    }

    /* -------------------------------------------- */
    /*  Application Drag/Drop                       */
    /* -------------------------------------------- */

    async _onDropItem(event, item) {
        const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
        const physicalActorTypes = ['character', 'party'];
        const originActor = item.actor;
        if (
            item.actor?.uuid === this.document.uuid ||
            !originActor ||
            !physicalActorTypes.includes(this.document.type)
        ) {
            return super._onDropItem(event, item);
        }

        /* Handling transfer of inventoryItems */
        if (item.system.metadata.isInventoryItem) {
            if (item.system.metadata.isQuantifiable) {
                const actorItem = originActor.items.get(data.originId);
                const quantityTransfered =
                    actorItem.system.quantity === 1
                        ? 1
                        : await game.system.api.applications.dialogs.ItemTransferDialog.configure(item);

                if (quantityTransfered) {
                    if (quantityTransfered === actorItem.system.quantity) {
                        await originActor.deleteEmbeddedDocuments('Item', [data.originId]);
                    } else {
                        await actorItem.update({
                            'system.quantity': actorItem.system.quantity - quantityTransfered
                        });
                    }

                    const existingItem = this.document.items.find(x => itemIsIdentical(x, item));
                    if (existingItem) {
                        await existingItem.update({
                            'system.quantity': existingItem.system.quantity + quantityTransfered
                        });
                    } else {
                        const createData = item.toObject();
                        await this.document.createEmbeddedDocuments('Item', [
                            {
                                ...createData,
                                system: {
                                    ...createData.system,
                                    quantity: quantityTransfered
                                }
                            }
                        ]);
                    }
                }
            } else {
                await originActor.deleteEmbeddedDocuments('Item', [data.originId]);
                await this.document.createEmbeddedDocuments('Item', [item.toObject()]);
            }
        }
    }

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
            return;
        } 
        
        const item = await getDocFromElement(event.target);
        if (item) {
            const dragData = {
                originActor: this.document.uuid,
                originId: item.id,
                type: item.documentName,
                uuid: item.uuid
            };
            event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
        }

        super._onDragStart(event);
    }
}
