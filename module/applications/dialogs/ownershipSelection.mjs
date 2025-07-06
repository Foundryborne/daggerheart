const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class OwnershipSelection extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(resolve, reject, name, ownership) {
        super({});

        this.resolve = resolve;
        this.reject = reject;
        this.name = name;
        this.ownership = ownership;
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'views', 'ownership-selection'],
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

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.ownershipOptions = Object.keys(CONST.DOCUMENT_OWNERSHIP_LEVELS).map(level => ({
            value: CONST.DOCUMENT_OWNERSHIP_LEVELS[level],
            label: game.i18n.localize(`OWNERSHIP.${level}`)
        }));
        context.ownership = {
            default: this.ownership.default,
            players: Object.keys(this.ownership.players).reduce((acc, x) => {
                const user = game.users.get(x);
                if (!user.isGM) {
                    acc[x] = {
                        img: user.character?.img ?? 'icons/svg/cowled.svg',
                        name: user.name,
                        ownership: this.ownership.players[x].value
                    };
                }

                return acc;
            }, {})
        };

        return context;
    }

    static async updateData(event, _, formData) {
        const { ownership } = foundry.utils.expandObject(formData.object);

        this.resolve(ownership);
        this.close(true);
    }

    async close(fromSave) {
        if (!fromSave) {
            this.reject();
        }

        await super.close();
    }
}
