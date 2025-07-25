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

    async toChat(origin) {
        const cls = getDocumentClass('ChatMessage');
        const systemData = {
            title:
                this.type === 'ancestry'
                    ? game.i18n.localize('DAGGERHEART.UI.Chat.foundationCard.ancestryTitle')
                    : this.type === 'community'
                      ? game.i18n.localize('DAGGERHEART.UI.Chat.foundationCard.communityTitle')
                      : this.type === 'feature'
                        ? game.i18n.localize('TYPES.Item.feature')
                        : game.i18n.localize('DAGGERHEART.UI.Chat.foundationCard.subclassFeatureTitle'),
            origin: origin,
            img: this.img,
            name: this.name,
            description: this.system.description,
            actions: []
        };
        const msg = new cls({
            type: 'abilityUse',
            user: game.user.id,
            system: systemData,
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/ui/chat/ability-use.hbs',
                systemData
            )
        });

        cls.create(msg.toObject());
    }
}
