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
        classes: ['daggerheart', 'views', 'damage-selection'],
        position: {
            width: 400,
            height: 'auto'
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
            template: 'systems/daggerheart/templates/views/damageSelection.hbs'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.title = this.config.title;
        context.extraFormula = this.config.extraFormula;
        context.formula = this.roll.constructFormula(this.config);;
        return context;
    }

    static updateRollConfiguration(event, _, formData) {
        const { ...rest } = foundry.utils.expandObject(formData.object);
        this.config.extraFormula = rest.extraFormula;
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
