import ActionSelectionDialog from '../applications/dialogs/actionSelectionDialog.mjs';

/**
 * Override and extend the basic Item implementation.
 * @extends {foundry.documents.Item}
 */
export default class DHItem extends foundry.documents.Item {
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

    /**
     * @inheritdoc
     * @param {object} options - Options which modify the getRollData method.
     * @returns
     */
    getRollData(options = {}) {
        let data;
        if (this.system.getRollData) data = this.system.getRollData(options);
        else {
            const actorRollData = this.actor?.getRollData(options) ?? {};
            data = { ...actorRollData, item: { ...this.system } };
        }

        if (data?.item) {
            data.item.flags = { ...this.flags };
            data.item.name = this.name;
        }
        return data;
    }

    /**
     * Determine if this item is classified as an inventory item based on its metadata.
     * @returns {boolean} Returns `true` if the item is an inventory item.
     */
    get isInventoryItem() {
        return this.system.metadata.isInventoryItem ?? false;
    }

    /** @inheritdoc */
    static async createDialog(data = {}, createOptions = {}, options = {}) {
        const { folders, types, template, context = {}, ...dialogOptions } = options;

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

        return await super.createDialog(data, createOptions, {
            folders,
            types,
            template,
            context: { types: sortedTypes, ...context },
            ...dialogOptions
        });
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
            description: this.system.description
        };

        const msg = {
            type: 'abilityUse',
            user: game.user.id,
            actor: item.parent,
            speaker: cls.getSpeaker(),
            system: systemData,
            title: game.i18n.localize('DAGGERHEART.ACTIONS.Config.displayInChat'),
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
}
