import ActionSelectionDialog from '../applications/dialogs/actionSelectionDialog.mjs';
import { fromUuids, keyBy, pick } from '../helpers/utils.mjs';

/**
 * Override and extend the basic Item implementation.
 * @extends {foundry.documents.Item}
 */
export default class DHItem extends foundry.documents.Item {
    /** 
     * Returns the uuid of the original item this item was derived from, 
     * or its own uuid if its a compendium item or not derived from a source item.
     * @returns {string}
     */
    get sourceUuid() {
        const isCompendium = this._id && this.pack && !this.isEmbedded;
        return isCompendium ? this.uuid : this._stats.compendiumSource ?? this._stats.duplicateSource ?? this.uuid;
    }

    /**
     * Returns the uuid of the item that is used for refreshing.
     * This isn't necessarily the sourceUuid. Compendium items don't have a refresh source.
     * @returns {string | null} the uuid to refresh from, or null if it can't be refreshed
     */
    get refreshSourceUuid() {
        // no refreshing compendium items
        // ancestry items also aren't refreshable
        if (this.pack || this.type === 'ancestry') return null;

        const actor = this.actor;
        if (['adversary', 'environment'].includes(actor?.type)) {
            const uuid = `${actor.refreshSourceUuid}.Item.${this.id}`;
            return uuid.startsWith('Compendium.') ? uuid : null;
        }
        
        return this._stats.compendiumSource?.startsWith('Compendium.') ? this._stats.compendiumSource : null;
    }

    /**
     * Determine if this item is classified as an inventory item based on its metadata.
     * @returns {boolean} Returns `true` if the item is an inventory item.
     */
    get isInventoryItem() {
        return this.system.metadata.isInventoryItem ?? false;
    }

    /** 
     * Returns true if the item can be used
     * @returns {boolean}
     */
    get usable() {
        const actor = this.actor;
        const pack = actor?.pack ? game.packs.get(actor.pack) : null;
        const hasActions = this.system.actionsList?.size || this.system.actionsList?.length;
        const isValidType = actor?.type === 'character' || this.type === 'feature';
        return !pack?.locked && this.isOwner && isValidType && hasActions;
    }

    /** Returns true if the item has a description, usually if there is a description field, or if there are item features */
    get hasDescription() {
        return Boolean(this.system.description) 
            || Boolean(this.system.itemFeatures?.length)
            || (Boolean(this.system.gmNotes) && game.user.isGM);
    }

    /** @inheritDoc */
    prepareEmbeddedDocuments() {
        super.prepareEmbeddedDocuments();
        for (const action of this.system.actions ?? []) action.prepareData();
    }

    /** @inheritDoc */
    getEmbeddedDocument(embeddedName, id, options) {
        let doc;
        switch (embeddedName) {
            case 'Action':
                doc = this.system.actions?.get(id);
                if (!doc && this.system.attack?.id === id) doc = this.system.attack;
                break;
            default:
                return super.getEmbeddedDocument(embeddedName, id, options);
        }
        if (options?.strict && !doc) {
            throw new Error(`The key ${id} does not exist in the ${embeddedName} Collection`);
        }
        return doc;
    }
    
    static async createDocuments(sources, operation) {
        // Ensure that items being created are valid to the actor its being added to
        const actor = operation.parent;
        const addedType = sources[0]?.type;
        sources = actor ? sources.filter(s => actor.system.isItemValid(s)) : sources;
        if (actor && sources.length === 0 && addedType) {
            const itemType = _loc(`TYPES.Item.${addedType}`);
            const actorType = _loc(`TYPES.Actor.${actor.type}`);
            ui.notifications.error('DAGGERHEART.ACTORS.Base.CannotAddType', { format: { itemType, actorType } });
        }
        
        // Beastform already manages its features creation
        if (addedType !== 'beastform') await this.prepareGrantedItems(actor, sources, operation);

        return super.createDocuments(sources, operation);
    }

    static async prepareGrantedItems(actor, sources, operation) {
        // If the item grants any features, include them and set the granter flags
        // If keepId is false, set random ids and from then on switch keepId to true
        const grantingItems = actor ? sources.filter(s => s.system?.features?.length) : [];
        if (grantingItems.length && !operation.keepId) {
            for (const source of sources) {
                source._id = foundry.utils.randomID();
            }
            operation.keepId = true;
        }

        const getUuid = f => {
            const item = f.item === null ? null : (f.item ?? f);
            return typeof item === 'object' ? item.uuid : item;
        } 

        const grantedFeatures = await fromUuids(
            grantingItems.flatMap(i => i.system.features.map(getUuid))
        );
        const grantedFeaturesByUuid = keyBy(grantedFeatures, f => f.uuid)
        for (const granter of grantingItems) {
            for (const f of granter.system.features) {
                const itemUuid = getUuid(f);
                if (!itemUuid) continue;

                const feature = grantedFeaturesByUuid[itemUuid];
                sources.push(
                    foundry.utils.mergeObject(feature.toObject(), {
                        _stats: {
                            compendiumSource: itemUuid.startsWith('Compendium.') ? itemUuid : null,
                            duplicateSource: !itemUuid.startsWith('Compendium.') ? itemUuid : null
                        },
                        system: {
                            granter: {
                                id: granter._id,
                                type: granter.type,
                                multiclass: Boolean(granter.system.isMulticlass),
                                identifier: f.type ?? null
                            }
                        }
                    })
                );
            }
        }
    }

    static async deleteDocuments(ids = [], operation = {}) {
        const allIds = operation.parent ? ids.flatMap(id => (
            [id, ...operation.parent.items.get(id).system.getLinkedItems().map(x => x.id)]
        )) : ids;

        return super.deleteDocuments(allIds, operation);
    }

    /* -------------------------------------------- */

    /**
     * @inheritdoc
     * @param {object} options - Options which modify the getRollData method.
     * @returns
     */
    getRollData(options = {}) {
        let data = this.system.getRollData(options);
        if (data?.item) {
            data.item.flags = { ...this.flags };
            data.item.name = this.name;
        }
        return data;
    }


    /** @inheritdoc */
    static async createDialog(data = {}, createOptions = {}, options = {}, renderOptions) {
        const { folders, types, template, context = {}, ...dialogOptions } = options;
        dialogOptions.classes = [options.classes ?? [], 'item-create'].flat(); // handled in hook

        if (types?.length === 0) {
            throw new Error('The array of sub-types to restrict to must not be empty.');
        }

        const documentTypes = this.TYPES.filter(type => type !== 'base' && (!types || types.includes(type))).map(
            type => {
                const labelKey = CONFIG.Item?.typeLabels?.[type];
                const label = labelKey && game.i18n.has(labelKey) ? game.i18n.localize(labelKey) : type;

                const isInventoryItem = CONFIG.Item.dataModels[type]?.metadata?.isInventoryItem;
                const group =
                    isInventoryItem === true
                        ? 'Inventory Items' //TODO localize
                        : isInventoryItem === false
                            ? 'Character Items' //TODO localize
                            : 'Other'; //TODO localize

                return { value: type, label, group };
            }
        );

        if (!documentTypes.length) {
            throw new Error('No document types were permitted to be created.'); //TODO localize
        }

        const sortedTypes = documentTypes.sort((a, b) => a.label.localeCompare(b.label, game.i18n.lang));

        const collection = createOptions?.pack ? game.packs.get(createOptions.pack)?.folders : game.items.folders;
        const folder = collection?.get(data.folder) ?? null;
        dialogOptions.defaultEntity = folder?.getDefaultEntity(); // used in hook

        return await super.createDialog(data, createOptions, {
            folders,
            types,
            template,
            context: { types: sortedTypes, ...context },
            ...dialogOptions
        }, renderOptions);
    }

    /* -------------------------------------------- */

    /**
     * Generate an array of localized tag.
     * @returns {string[]} An array of localized tag strings.
     */
    _getTags() {
        const tags = [];
        if (this.system._getTags) tags.push(...this.system._getTags());
        return tags;
    }

    /**
     * Generate a localized label array for this item.
     * @returns {(string | { value: string, icons: string[] })[]} An array of localized strings and damage label objects.
     */
    _getLabels() {
        const labels = [];
        if (this.system._getLabels) labels.push(...this.system._getLabels());
        return labels;
    }

    /* -------------------------------------------- */

    /**@inheritdoc */
    static getDefaultArtwork(itemData) {
        const { type } = itemData;
        const Model = CONFIG.Item.dataModels[type];
        const img = Model.DEFAULT_ICON ?? this.DEFAULT_ICON;
        return { img };
    }

    /* -------------------------------------------- */

    async use(event) {
        /* DomainCard check. Can be expanded or made neater */
        if (this.system.isDomainTouchedSuppressed) {
            return ui.notifications.warn(
                game.i18n.format('DAGGERHEART.UI.Notifications.domainTouchRequirement', {
                    nr: this.domainTouched,
                    domain: game.i18n.localize(CONFIG.DH.DOMAIN.allDomains()[this.domain].label)
                })
            );
        }

        const actions = new Set(this.system.actionsList);
        if (actions?.size) {
            let action = actions.first();
            if (actions.size > 1 && !event?.shiftKey) {
                // Actions Choice Dialog
                action = await ActionSelectionDialog.create(this, event);
            }
            if (action) return action.use(event);
        }
    }

    /**
     * Create a new ChatMessage to display this document’s data
     * @param {String} origin - uuid of a document. TODO: This needs to be reviewed.
     */
    async toChat(origin) {
        /**@type {foundry.documents.ChatMessage} */
        const cls = getDocumentClass('ChatMessage');
        const item = await foundry.utils.fromUuid(origin);

        const systemData = {
            origin: origin,
            img: this.img,
            item: {
                name: this.name,
                img: this.img,
                tags: this._getTags()
            },
            actions: item.system.actionsList,
            description: await this.system.getEnrichedDescription()
        };

        const msg = {
            type: 'abilityUse',
            user: game.user.id,
            actor: item.parent,
            speaker: cls.getSpeaker(),
            system: systemData,
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/ui/chat/ability-use.hbs',
                systemData
            ),
            flags: {
                daggerheart: {
                    cssClass: 'dh-chat-message dh-style'
                }
            }
        };

        cls.create(msg);
    }

    deleteTriggers() {
        const actions = Array.from(this.system.actions ?? []);
        if (!actions.length) return;

        const triggerKeys = actions.flatMap(action => action.triggers.map(x => x.trigger));

        game.system.registeredTriggers.unregisterTriggers(triggerKeys, this.uuid);

        if (this.actor && !(this.actor.parent instanceof game.system.api.documents.DhToken)) {
            for (const token of this.actor.getActiveTokens()) {
                game.system.registeredTriggers.unregisterTriggers(triggerKeys, `${token.document.uuid}.${this.uuid}`);
            }
        }
    }

    async _preDelete() {
        this.deleteTriggers();
    }

    /** @inheritDoc */
    static migrateData(source) {
        const documentClass = game.system.api.data.items[`DH${source.type?.capitalize()}`];
        if (documentClass?.migrateDocumentData) {
            documentClass.migrateDocumentData(source);
        }

        for (const action of Object.values(source.system?.actions ?? {})) {
            if (action.damage?.resources?.weaponResource) {
                action.damage.resources.resource = action.damage.resources.weaponResource;
                action.damage.resources.resource.applyTo = CONFIG.DH.GENERAL.healingTypes.resource.id;
                action.damage.resources.resource.itemId = source._id;
                delete action.damage.resources.weaponResource;
            }
        }

        return super.migrateData(source);
    }

    /** 
     * Refreshes this item's data and effects using information from the compendium.
     * @param {options} [options]
     * @param {boolean} [options.save] if set to false, returns the batch data to perform the operation instead of doing it
     */
    async refreshFromCompendium({ save = true, latest } = {}) {
        latest ??= await fromUuid(this.refreshSourceUuid);
        if (!latest) {
            return ui.notifications.error(_loc('DAGGERHEART.ITEMS.Base.Refresh.Error.doesNotExist'));
        }
        if (latest.type !== this.type) {
            return ui.notifications.error(_loc('DAGGERHEART.ITEMS.Base.Refresh.Error.invalidType'));
        }

        // Get system data, preserving certain properties
        const currentSource = this.toObject(true);
        const latestSource = latest.toObject(true);
        const system = foundry.utils.mergeObject(latestSource.system, pick(currentSource.system, [
            // General
            'gmNotes',
            // domain cards
            'inVault',
            // inventory items
            'quantity',
            'equipped',
            // features
            'granter',
            // subclass (and class)
            'featureState',
            'isMulticlass'
        ]), { recursive: false });

        // Handle Effects
        const effectsToDelete = this.effects.filter(e => !latest.effects.has(e.id)).map(i => i.id);
        const effectUpdates = [];
        const effectCreates = [];
        for (const effectSource of latestSource.effects) {
            const existingEffect = this.effects.get(effectSource._id)?.toObject(true);
            if (!existingEffect) {
                effectCreates.push(effectSource);
            } else {
                effectUpdates.push(foundry.utils.mergeObject(effectSource, pick(existingEffect, ['disabled'])))
            }
        }

        /** @type {foundry.abstract.types.DatabaseWriteOperation[]} */
        const batch = [{
            parent: this.parent,
            documentName: this.documentName,
            pack: this.pack,
            action: 'update',
            updates: [{
                _id: this._id,
                name: latestSource.name,
                img: latestSource.img,
                system: _replace(system)
            }]
        }];
        if (effectCreates.length) {
            batch.push({
                parent: this,
                documentName: 'ActiveEffect',
                action: 'create',
                data: effectCreates,
                keepId: true
            });
        }
        if (effectUpdates.length) {
            batch.push({
                parent: this,
                documentName: 'ActiveEffect',
                action: 'update',
                updates: effectUpdates,
                recursive: false,
                diff: false
            });
        }
        if (effectsToDelete.length) {
            batch.push({
                parent: this,
                documentName: 'ActiveEffect',
                action: 'delete',
                ids: effectsToDelete
            });
        }
        if (save) {
            if (batch.length) await foundry.documents.modifyBatch(batch);
        } else {
            return batch;
        }
    }
}
