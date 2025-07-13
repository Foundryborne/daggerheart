const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class ResourceDiceDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(name, recovery, actor, resource, options = {}) {
        super(options);

        this.name = name;
        this.recovery = recovery;
        this.actor = actor;
        this.resource = resource;
        this.diceStates = foundry.utils.deepClone(resource.diceStates);
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'dialog', 'dh-style', 'views', 'resource-dice'],
        window: {
            icon: 'fa-solid fa-dice'
        },
        actions: {
            rerollDice: this.rerollDice,
            save: this.save
        },
        form: {
            handler: this.updateResourceDice,
            submitOnChange: true,
            submitOnClose: false
        }
    };

    /** @override */
    static PARTS = {
        resourceDice: {
            id: 'resourceDice',
            template: 'systems/daggerheart/templates/dialogs/dice-roll/resourceDice.hbs'
        }
    };

    get title() {
        return game.i18n.format('DAGGERHEART.APPLICATIONS.ResourceDice.title', { name: this.name });
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.name = this.name;
        context.recovery = game.i18n.localize(CONFIG.DH.GENERAL.refreshTypes[this.recovery].label);
        context.resource = this.resource;
        context.diceStates = this.diceStates;
        context.actor = this.actor;

        return context;
    }

    static async updateResourceDice(event, _, formData) {
        const { diceStates } = foundry.utils.expandObject(formData.object);
        this.diceStates = Object.keys(diceStates).reduce((acc, key) => {
            const resourceState = this.resource.diceStates[key];
            acc[key] = { ...diceStates[key], used: Boolean(resourceState?.used) };
            return acc;
        }, {});

        this.render();
    }

    static async save() {
        this.rollValues = Object.values(this.diceStates);
        this.close();
    }

    static async rerollDice() {
        const diceFormula = `${this.resource.max}d${this.resource.dieFaces}`;
        const roll = await new Roll(diceFormula).evaluate();
        if (game.modules.get('dice-so-nice')?.active) await game.dice3d.showForRoll(roll, game.user, true);
        this.rollValues = roll.terms[0].results.map(x => ({ value: x.result, used: false }));
        this.resetUsed = true;

        const cls = getDocumentClass('ChatMessage');
        const msg = new cls({
            user: game.user.id,
            content: await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/ui/chat/resource-roll.hbs',
                {
                    user: this.actor.name,
                    name: this.name
                }
            )
        });

        cls.create(msg.toObject());
        this.close();
    }

    static async create(name, recovery, actor, resource, options = {}) {
        return new Promise(resolve => {
            const app = new this(name, recovery, actor, resource, options);
            app.addEventListener('close', () => resolve(app.rollValues), { once: true });
            app.render({ force: true });
        });
    }
}
