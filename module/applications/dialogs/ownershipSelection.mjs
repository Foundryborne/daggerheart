const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class OwnershipSelection extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(name, ownership, defaultOwnership) {
        super({});

        this.name = name;
        this.ownership = foundry.utils.deepClone(ownership);
        this.defaultOwnership = defaultOwnership;
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'views', 'dialog', 'dh-style', 'ownership-selection'],
        window: {
            icon: 'fa-solid fa-users'
        },
        position: {
            width: 600,
            height: 'auto'
        },
        form: { handler: this.updateData }
    };

    static PARTS = {
        selection: {
            template: 'systems/daggerheart/templates/dialogs/ownershipSelection.hbs'
        }
    };

    get title() {
        return game.i18n.format('DAGGERHEART.APPLICATIONS.OwnershipSelection.title', { name: this.name });
    }

    getOwnershipData(id) {
        return this.ownership[id] ?? CONST.DOCUMENT_OWNERSHIP_LEVELS.INHERIT;
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.ownershipDefaultOptions = CONFIG.DH.GENERAL.basicOwnershiplevels;
        context.ownershipOptions = CONFIG.DH.GENERAL.simpleOwnershiplevels;
        context.defaultOwnership = this.defaultOwnership;
        context.ownership = game.users.reduce((acc, user) => {
            if (!user.isGM) {
                acc[user.id] = {
                    ...user,
                    img: user.character?.img ?? 'icons/svg/cowled.svg',
                    ownership: this.getOwnershipData(user.id)
                };
            }

            return acc;
        }, {});

        return context;
    }

    static async updateData(event, _, formData) {
        const data = foundry.utils.expandObject(formData.object);
        this.close(data);
    }

    async close(data) {
        if (data) {
            this.saveData = data;
        }

        await super.close();
    }

    static async configure(name, ownership, defaultOwnership) {
        return new Promise(resolve => {
            const app = new this(name, ownership, defaultOwnership);
            app.addEventListener('close', () => resolve(app.saveData), { once: true });
            app.render({ force: true });
        });
    }
}
