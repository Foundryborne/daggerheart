import { itemAbleRollParse } from '../../helpers/utils.mjs';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class ResourceDiceDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(item, actor, options = {}) {
        super(options);

        this.item = item;
        this.actor = actor;
        this.diceStates = foundry.utils.deepClone(item.system.resource.diceStates);
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
        return game.i18n.format('DAGGERHEART.APPLICATIONS.ResourceDice.title', { name: this.item.name });
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.item = this.item;
        context.actor = this.actor;
        context.diceStates = this.diceStates;

        return context;
    }

    static async updateResourceDice(event, _, formData) {
        const { diceStates } = foundry.utils.expandObject(formData.object);
        this.diceStates = Object.keys(diceStates).reduce((acc, key) => {
            const resourceState = this.item.system.resource.diceStates[key];
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
        const max = itemAbleRollParse(this.item.system.resource.max, this.actor, this.item);
        const diceFormula = `${max}d${this.item.system.resource.dieFaces}`;
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
                    name: this.item.name
                }
            )
        });

        cls.create(msg.toObject());
        this.close();
    }

    static async create(item, actor, options = {}) {
        return new Promise(resolve => {
            const app = new this(item, actor, options);
            app.addEventListener('close', () => resolve(app.rollValues), { once: true });
            app.render({ force: true });
        });
    }
}
