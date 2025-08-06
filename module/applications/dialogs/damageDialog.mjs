const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class DamageDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(roll, config = {}, options = {}) {
        super(options);

        this.roll = roll;
        this.config = config;
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        id: 'roll-selection',
        classes: ['daggerheart', 'dialog', 'dh-style', 'views', 'damage-selection'],
        position: {
            width: 400,
            height: 'auto'
        },
        window: {
            icon: 'fa-solid fa-dice'
        },
        actions: {
            submitRoll: this.submitRoll
        },
        form: {
            handler: this.updateRollConfiguration,
            submitOnChange: true,
            submitOnClose: false
        }
    };

    /** @override */
    static PARTS = {
        damageSelection: {
            id: 'damageSelection',
            template: 'systems/daggerheart/templates/dialogs/dice-roll/damageSelection.hbs'
        }
    };

    get title() {
        return game.i18n.localize(
            `DAGGERHEART.EFFECTS.ApplyLocations.${this.config.hasHealing ? 'healing' : 'damage'}Roll.name`
        );
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.config = CONFIG.DH;
        context.title = this.config.title ?? this.title;
        context.formula = this.roll.constructFormula(this.config);
        context.hasHealing = this.config.hasHealing;
        context.directDamage = this.config.directDamage;
        context.selectedRollMode = this.config.selectedRollMode;
        context.rollModes = Object.entries(CONFIG.Dice.rollModes).map(([action, { label, icon }]) => ({
            action,
            label,
            icon
        }));
        return context;
    }

    static updateRollConfiguration(_event, _, formData) {
        const { ...rest } = foundry.utils.expandObject(formData.object);
        foundry.utils.mergeObject(this.config.roll, rest.roll);
        this.config.selectedRollMode = rest.selectedRollMode;

        this.render();
    }

    static async submitRoll() {
        await this.close({ submitted: true });
    }

    /** @override */
    _onClose(options = {}) {
        if (!options.submitted) this.config = false;
    }

    static async configure(roll, config = {}) {
        return new Promise(resolve => {
            const app = new this(roll, config);
            app.addEventListener('close', () => resolve(app.config), { once: true });
            app.render({ force: true });
        });
    }
}
