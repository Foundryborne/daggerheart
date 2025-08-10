const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class D20RollDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(roll, config = {}, options = {}) {
        super(options);

        this.roll = roll;
        this.config = config;
        this.config.experiences = [];
        this.reactionOverride = config.roll?.type === 'reaction';

        if (config.source?.action) {
            this.item = config.data.parent.items.get(config.source.item) ?? config.data.parent;
            this.action =
                config.data.attack?._id == config.source.action
                    ? config.data.attack
                    : this.item.system.actions.get(config.source.action);
        }
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        id: 'roll-selection',
        classes: ['daggerheart', 'dialog', 'dh-style', 'views', 'roll-selection'],
        position: {
            width: 'auto'
        },
        window: {
            icon: 'fa-solid fa-dice'
        },
        actions: {
            updateIsAdvantage: this.updateIsAdvantage,
            selectExperience: this.selectExperience,
            toggleReaction: this.toggleReaction,
            submitRoll: this.submitRoll
        },
        form: {
            handler: this.updateRollConfiguration,
            submitOnChange: true,
            submitOnClose: false
        }
    };

    get title() {
        return this.config.title;
    }

    get actor() {
        return this.config?.data?.parent;
    }

    /** @override */
    static PARTS = {
        header: {
            id: 'header',
            template: 'systems/daggerheart/templates/dialogs/dice-roll/header.hbs'
        },
        rollSelection: {
            id: 'rollSelection',
            template: 'systems/daggerheart/templates/dialogs/dice-roll/rollSelection.hbs'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.rollConfig = this.config;
        context.hasRoll = !!this.config.roll;
        context.canRoll = true;
        context.selectedRollMode = this.config.selectedRollMode;
        context.rollModes = Object.entries(CONFIG.Dice.rollModes).map(([action, { label, icon }]) => ({
            action,
            label,
            icon
        }));

        this.config.costs ??= [];
        if (this.config.costs?.length) {
            const updatedCosts = game.system.api.fields.ActionFields.CostField.calcCosts.call(
                this.action ?? { actor: this.actor },
                this.config.costs
            );
            context.costs = updatedCosts.map(x => ({
                ...x,
                label: x.keyIsID
                    ? this.action.parent.parent.name
                    : game.i18n.localize(CONFIG.DH.GENERAL.abilityCosts[x.key].label)
            }));
            context.canRoll = game.system.api.fields.ActionFields.CostField.hasCost.call(
                this.action ?? { actor: this.actor },
                updatedCosts
            );
            this.config.data.scale = this.config.costs[0].total;
        }
        if (this.config.uses?.max) {
            context.uses = game.system.api.fields.ActionFields.UsesField.calcUses.call(this.action, this.config.uses);
            context.canRoll =
                context.canRoll &&
                game.system.api.fields.ActionFields.UsesField.hasUses.call(this.action, context.uses);
        }
        if (this.roll) {
            context.roll = this.roll;
            context.rollType = this.roll?.constructor.name;
            context.rallyDie = this.roll.rallyChoices;
            const experiences = this.config.data?.experiences || {};
            context.experiences = Object.keys(experiences).map(id => ({
                id,
                ...experiences[id]
            }));
            context.selectedExperiences = this.config.experiences;
            context.advantage = this.config.roll?.advantage;
            context.disadvantage = this.config.roll?.disadvantage;
            context.diceOptions = CONFIG.DH.GENERAL.diceTypes;
            context.isLite = this.config.roll?.lite;
            context.extraFormula = this.config.extraFormula;
            context.formula = this.roll.constructFormula(this.config);

            context.showReaction = !context.rollConfig.type && context.rollType === 'DualityRoll';
            context.reactionOverride = this.reactionOverride;
        }
        return context;
    }

    static updateRollConfiguration(event, _, formData) {
        const { ...rest } = foundry.utils.expandObject(formData.object);
        this.config.selectedRollMode = rest.selectedRollMode;

        if (this.config.costs) {
            this.config.costs = foundry.utils.mergeObject(this.config.costs, rest.costs);
        }
        if (this.config.uses) this.config.uses = foundry.utils.mergeObject(this.config.uses, rest.uses);
        if (rest.roll?.dice) {
            Object.entries(rest.roll.dice).forEach(([key, value]) => {
                this.roll[key] = value;
            });
        }
        this.config.extraFormula = rest.extraFormula;
        this.render();
    }

    static updateIsAdvantage(_, button) {
        const advantage = Number(button.dataset.advantage);
        this.advantage = advantage === 1;
        this.disadvantage = advantage === -1;

        this.config.roll.advantage = this.config.roll.advantage === advantage ? 0 : advantage;
        this.render();
    }

    static selectExperience(_, button) {
        this.config.experiences =
            this.config.experiences.indexOf(button.dataset.key) > -1
                ? this.config.experiences.filter(x => x !== button.dataset.key)
                : [...this.config.experiences, button.dataset.key];
        if (this.config?.data?.parent?.type === 'character' || this.config?.data?.parent?.type === 'companion') {
            this.config.costs =
                this.config.costs.indexOf(this.config.costs.find(c => c.extKey === button.dataset.key)) > -1
                    ? this.config.costs.filter(x => x.extKey !== button.dataset.key)
                    : [
                          ...this.config.costs,
                          {
                              extKey: button.dataset.key,
                              key: 'hope',
                              value: 1,
                              name: this.config.data?.experiences?.[button.dataset.key]?.name
                          }
                      ];
        }
        this.render();
    }

    static toggleReaction() {
        if (this.config.roll) {
            this.reactionOverride = !this.reactionOverride;
            this.config.roll.type = this.reactionOverride
                ? CONFIG.DH.ITEM.actionTypes.reaction.id
                : this.config.roll.type === CONFIG.DH.ITEM.actionTypes.reaction.id
                  ? null
                  : this.config.roll.type;
            this.render();
        }
    }

    static async submitRoll() {
        await this.close({ submitted: true });
    }

    /** @override */
    _onClose(options = {}) {
        if (!options.submitted) this.config = false;
    }

    static async configure(roll, config = {}, options = {}) {
        return new Promise(resolve => {
            const app = new this(roll, config, options);
            app.addEventListener('close', () => resolve(app.config), { once: true });
            app.render({ force: true });
        });
    }
}
