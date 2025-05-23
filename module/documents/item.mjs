export default class DhpItem extends Item {
    _preCreate(data, changes, user) {
        super._preCreate(data, changes, user);
    }

    prepareData() {
        super.prepareData();

        if (this.type === 'class') {
            // Bad. Make this better.
            // this.system.domains = CONFIG.daggerheart.DOMAIN.classDomainMap[Object.keys(CONFIG.daggerheart.DOMAIN.classDomainMap).find(x => x === this.name.toLowerCase())];
        }
    }

    isInventoryItem() {
        return ['weapon', 'armor', 'miscellaneous', 'consumable'].includes(this.type);
    }

    _onUpdate(data, options, userId) {
        super._onUpdate(data, options, userId);
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
        const html = await renderTemplate('systems/daggerheart/templates/sidebar/documentCreate.hbs', {
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
        });

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
}
