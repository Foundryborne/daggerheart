const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class DamageDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(config={}, options={}) {
        super(options);

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
        context.formula = this.config.formula;
        return context;
    }

    static async submitRoll() {
        await this.close({ submitted: true  });
    }

    /** @override */
    _onClose(options={}) {
        if ( !options.submitted ) this.config = false;
    }

    static async configure(config={}) {
        return new Promise(resolve => {
            const app = new this(config);
            app.addEventListener("close", () => resolve(app.config), { once: true });
            app.render({ force: true });
        });
    }
}