const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class CharacterResetDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(actor, options = {}) {
        super(options);

        this.actor = actor;
        this.data = {
            delete: {
                class: { keep: false, label: 'TYPES.Item.class' },
                subclass: { keep: false, label: 'TYPES.Item.subclass' },
                ancestry: { keep: false, label: 'TYPES.Item.ancestry' },
                community: { keep: false, label: 'TYPES.Item.community' }
            },
            optional: {
                portrait: { keep: true, label: 'DAGGERHEART.GENERAL.portrait' },
                name: { keep: true, label: 'Name' },
                biography: { keep: true, label: 'DAGGERHEART.GENERAL.Tabs.biography' },
                inventory: { keep: true, label: 'DAGGERHEART.GENERAL.inventory' }
            }
        };
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'dialog', 'dh-style', 'views', 'character-reset'],
        window: {
            icon: 'fa-solid fa-arrow-rotate-left',
            title: 'DAGGERHEART.APPLICATIONS.CharacterReset.title'
        },
        actions: {
            finishSelection: this.#finishSelection
        },
        form: {
            handler: this.updateData,
            submitOnChange: true,
            submitOnClose: false
        }
    };

    /** @override */
    static PARTS = {
        resourceDice: {
            id: 'resourceDice',
            template: 'systems/daggerheart/templates/dialogs/characterReset.hbs'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.data = this.data;

        return context;
    }

    static async updateData(event, _, formData) {
        const { data } = foundry.utils.expandObject(formData.object);

        this.data = foundry.utils.mergeObject(this.data, data);
        this.render();
    }

    static getUpdateData() {
        const update = {};
        if (!this.data.optional.portrait) update.if(!this.data.optional.biography);

        if (!this.data.optional.inventory) return update;
    }

    static async #finishSelection() {
        const update = {};
        if (!this.data.optional.name.keep) {
            const defaultName = game.system.api.documents.DhpActor.defaultName({ type: 'character' });
            foundry.utils.setProperty(update, 'name', defaultName);
            foundry.utils.setProperty(update, 'prototypeToken.name', defaultName);
        }

        if (!this.data.optional.portrait.keep) {
            foundry.utils.setProperty(update, 'img', this.actor.schema.fields.img.initial(this.actor));
            foundry.utils.setProperty(update, 'prototypeToken.==texture', {});
            foundry.utils.setProperty(update, 'prototypeToken.==ring', {});
        }

        if (this.data.optional.biography.keep)
            foundry.utils.setProperty(update, 'system.biography', this.actor.system.biography);

        if (this.data.optional.inventory.keep) foundry.utils.setProperty(update, 'system.gold', this.actor.system.gold);

        const { system, ...rest } = update;
        await this.actor.update({
            ...rest,
            '==system': system ?? {}
        });

        const inventoryItemTypes = ['weapon', 'armor', 'consumable', 'loot'];
        await this.actor.deleteEmbeddedDocuments(
            'Item',
            this.actor.items
                .filter(x => !inventoryItemTypes.includes(x.type) || !this.data.optional.inventory.keep)
                .map(x => x.id)
        );

        this.close();
    }
}
