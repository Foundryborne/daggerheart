export default class DhpItem extends Item {
    /** @inheritdoc */
    getEmbeddedDocument(embeddedName, id, { invalid = false, strict = false } = {}) {
        const systemEmbeds = this.system.constructor.metadata.embedded ?? {};
        if (embeddedName in systemEmbeds) {
            const path = `system.${systemEmbeds[embeddedName]}`;
            return foundry.utils.getProperty(this, path).get(id) ?? null;
        }
        return super.getEmbeddedDocument(embeddedName, id, { invalid, strict });
    }

    /** @inheritDoc */
    prepareEmbeddedDocuments() {
        super.prepareEmbeddedDocuments();
        for (const action of this.system.actions ?? []) action.prepareData();
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

    isInventoryItem() {
        return ['weapon', 'armor', 'miscellaneous', 'consumable'].includes(this.type);
    }

    static async createDialog(data = {}, { parent = null, pack = null, ...options } = {}) {
        const documentName = this.metadata.name;
        const types = game.documentTypes[documentName].filter(t => t !== CONST.BASE_DOCUMENT_TYPE);
        let collection;
        if (!parent) {
            if (pack) collection = game.packs.get(pack);
            else collection = game.collections.get(documentName);
        }
        const folders = collection?._formatFolderSelectOptions() ?? [];
        const label = game.i18n.localize(this.metadata.label);
        const title = game.i18n.format('DOCUMENT.Create', { type: label });
        const typeObjects = types.reduce((obj, t) => {
            const label = CONFIG[documentName]?.typeLabels?.[t] ?? t;
            obj[t] = { value: t, label: game.i18n.has(label) ? game.i18n.localize(label) : t };
            return obj;
        }, {});

        // Render the document creation form
        const html = await foundry.applications.handlebars.renderTemplate(
            'systems/daggerheart/templates/sidebar/documentCreate.hbs',
            {
                folders,
                name: data.name || game.i18n.format('DOCUMENT.New', { type: label }),
                folder: data.folder,
                hasFolders: folders.length >= 1,
                type: data.type || CONFIG[documentName]?.defaultType || typeObjects.armor,
                types: {
                    Items: [typeObjects.armor, typeObjects.weapon, typeObjects.consumable, typeObjects.miscellaneous],
                    Character: [
                        typeObjects.class,
                        typeObjects.subclass,
                        typeObjects.ancestry,
                        typeObjects.community,
                        typeObjects.feature,
                        typeObjects.domainCard
                    ]
                },
                hasTypes: types.length > 1
            }
        );

        // Render the confirmation dialog window
        return Dialog.prompt({
            title: title,
            content: html,
            label: title,
            callback: html => {
                const form = html[0].querySelector('form');
                const fd = new FormDataExtended(form);
                foundry.utils.mergeObject(data, fd.object, { inplace: true });
                if (!data.folder) delete data.folder;
                if (types.length === 1) data.type = types[0];
                if (!data.name?.trim()) data.name = this.defaultName();
                return this.create(data, { parent, pack, renderSheet: true });
            },
            rejectClose: false,
            options
        });
    }

    async selectActionDialog() {
        const content = await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/views/actionSelect.hbs',
                { actions: this.system.actions }
            ),
            title = 'Select Action',
            type = 'div',
            data = {};
        return Dialog.prompt({
            title,
            // label: title,
            content,
            type,
            callback: html => {
                const form = html[0].querySelector('form'),
                    fd = new foundry.applications.ux.FormDataExtended(form);
                return this.system.actions.find(a => a._id === fd.object.actionId);
            },
            rejectClose: false
        });
    }

    async use(event) {
        const actions = this.system.actions;
        let response;
        if (actions?.length) {
            let action = actions[0];
            if (actions.length > 1 && !event?.shiftKey) {
                // Actions Choice Dialog
                action = await this.selectActionDialog();
            }
            if (action) response = action.use(event);
            // Check Target
            // If action.roll           => Roll Dialog
            // Else If action.cost      => Cost Dialog
            // Then
            // Apply Cost
            // Apply Effect
        }
        // Display Item Card in chat
        return response;
    }
}
