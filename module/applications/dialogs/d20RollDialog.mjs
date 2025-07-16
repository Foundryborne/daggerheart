const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class D20RollDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(roll, config = {}, options = {}) {
        super(options);

        this.roll = roll;
        this.config = config;
        this.config.experiences = [];

        if (config.source?.action) {
            this.item = config.data.parent.items.get(config.source.item) ?? config.data.parent;
            this.action =
                config.data.attack?._id == config.source.action
                    ? config.data.attack
                    : this.item.system.actions.find(a => a._id === config.source.action);
        }
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        id: 'roll-selection',
        classes: ['daggerheart', 'dialog', 'dh-style', 'views', 'roll-selection'],
        position: {
            width: 550
        },
        window: {
            icon: 'fa-solid fa-dice'
        },
        actions: {
            updateIsAdvantage: this.updateIsAdvantage,
            selectExperience: this.selectExperience,
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

    /** @override */
    static PARTS = {
        header: {
            id: 'header',
            template: 'systems/daggerheart/templates/dialogs/dice-roll/header.hbs'
        },
        rollSelection: {
            id: 'rollSelection',
            template: 'systems/daggerheart/templates/dialogs/dice-roll/rollSelection.hbs'
        },
        costSelection: {
            id: 'costSelection',
            template: 'systems/daggerheart/templates/dialogs/dice-roll/costSelection.hbs'
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

        if (this.config.costs?.length) {
            const updatedCosts = this.action.calcCosts(this.config.costs);
            context.costs = updatedCosts.map(x => ({
                ...x,
                label: x.keyIsID
                    ? this.action.parent.parent.name
                    : game.i18n.localize(CONFIG.DH.GENERAL.abilityCosts[x.key].label)
            }));
            context.canRoll = this.action.hasCost(updatedCosts);
            this.config.data.scale = this.config.costs[0].total;
        }
        if (this.config.uses?.max) {
            context.uses = this.action.calcUses(this.config.uses);
            context.canRoll = context.canRoll && this.action.hasUses(context.uses);
        }
        if (this.roll) {
            context.roll = this.roll;
            context.rollType = this.roll?.constructor.name;
            context.rallyDie = this.roll.rallyChoices;
            context.experiences = Object.keys(this.config.data.experiences).map(id => ({
                id,
                ...this.config.data.experiences[id]
            }));
            context.selectedExperiences = this.config.experiences;
            context.advantage = this.config.roll?.advantage;
            context.disadvantage = this.config.roll?.disadvantage;
            context.diceOptions = CONFIG.DH.GENERAL.diceTypes;
            context.isLite = this.config.roll?.lite;
            context.extraFormula = this.config.extraFormula;
            context.formula = this.roll.constructFormula(this.config);
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
        this.render();
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
