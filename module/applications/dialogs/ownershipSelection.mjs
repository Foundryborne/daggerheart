const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

/**
 * @typedef OwnershipOptions
 * @property {number[]} ownershipOptions the options that will be shown as possible choices for each user
 * @property {number} default The default ownership option the players will default to
 * @property {number[]} defaultOwnershipOptions 
 */

/** A dialog for ownership selection */
export default class OwnershipSelection extends HandlebarsApplicationMixin(ApplicationV2) {
    /**
     * @param {string} name
     * @param {Record<string, number>} options.ownership
     * @param {OwnershipOptions} [options]
     */
    constructor(name, ownership, options = {}) {
        super({});

        this.name = name;
        this.ownership = ownership;
        this.ownershipOptions = options.ownershipOptions ?? [-1, 0, 2, 3]; // 1 isn't in our dictionary
        this.default = options.default;
        this.defaultOwnershipOptions = typeof options.default === 'number' || options.defaultOwnershipOptions 
            ? options.defaultOwnershipOptions ?? this.ownershipOptions
            : null;
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'views', 'dialog', 'dh-style', 'ownership-selection'],
        window: {
            icon: 'fa-solid fa-users'
        },
        position: {
            width: 450,
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
        
        // Get ownership options. becuase of the use of numbers, the base collection is not correctly ordered.
        // So we have to redefine it ourselves in the correct order.
        context.ownershipOptions = this.ownershipOptions.map(value => ({
            value, 
            label: CONFIG.DH.GENERAL.simpleOwnershiplevels[value].label
        }));
        context.defaultOwnershipOptions = this.defaultOwnershipOptions?.map(value => ({
            value, 
            label: CONFIG.DH.GENERAL.simpleOwnershiplevels[value].label
        }));
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
        context.default = this.default;
        context.showOwnership = Boolean(Object.keys(context.ownership).length);

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

    /**
     * Creates a ownership selection dialog returns the result when resolved
     * @param {string} name 
     * @param {Record<string, number>} ownership
     * @param {OwnershipOptions} options
     * @returns {Promise<{ ownership: number; default?: number }>}
     */
    static async configure(name, ownership, options) {
        return new Promise(resolve => {
            const app = new this(name, ownership, options);
            app.addEventListener('close', () => resolve(app.saveData), { once: true });
            app.render({ force: true });
        });
    }
}
