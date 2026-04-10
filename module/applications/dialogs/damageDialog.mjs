const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class DamageDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(roll, config = {}, options = {}) {
        super(options);

        this.roll = roll;
        this.config = config;
        this.selectedEffects = this.config.bonusEffects;
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
            toggleSelectedEffect: this.toggleSelectedEffect,
            updateGroupAttack: this.updateGroupAttack,
            toggleCritical: this.toggleCritical,
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
        context.selectedMessageMode = this.config.selectedMessageMode;
        context.isCritical = this.config.isCritical;
        context.rollModes = Object.entries(CONFIG.ChatMessage.modes).map(([action, { label, icon }]) => ({
            action,
            label,
            icon
        }));
        context.modifiers = this.config.modifiers;
        context.hasSelectedEffects = Boolean(Object.keys(this.selectedEffects).length);
        context.selectedEffects = this.selectedEffects;

        context.damageOptions = this.config.damageOptions;
        context.rangeOptions = CONFIG.DH.GENERAL.groupAttackRange;

        return context;
    }

    static updateRollConfiguration(_event, _, formData) {
        const data = foundry.utils.expandObject(formData.object);
        foundry.utils.mergeObject(this.config.roll, data.roll);
        foundry.utils.mergeObject(this.config.modifiers, data.modifiers);
        this.config.selectedMessageMode = data.selectedMessageMode;

        if (data.damageOptions) {
            const numAttackers = data.damageOptions.groupAttack?.numAttackers;
            if (typeof numAttackers !== 'number' || numAttackers % 1 !== 0) {
                data.damageOptions.groupAttack.numAttackers = null;
            }

            foundry.utils.mergeObject(this.config.damageOptions, data.damageOptions);
        }

        this.render();
    }

    static updateGroupAttack() {
        const targets = Array.from(game.user.targets);
        if (targets.length === 0)
            return ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.noTokenTargeted'));

        const actorId = this.roll.data.parent.id;
        const range = this.config.damageOptions.groupAttack.range;
        const groupAttackTokens = game.system.api.fields.ActionFields.DamageField.getGroupAttackTokens(actorId, range);

        this.config.damageOptions.groupAttack.numAttackers = groupAttackTokens.length;
        this.render();
    }

    static toggleCritical() {
        this.config.isCritical = !this.config.isCritical;
        this.render();
    }

    static toggleSelectedEffect(_event, button) {
        this.selectedEffects[button.dataset.key].selected = !this.selectedEffects[button.dataset.key].selected;
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
