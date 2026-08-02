const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class DamageDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(roll, config = {}, options = {}) {
        super(options);

        this.roll = roll;
        this.config = config;
        
        /** The original isCritical state before any alterations in the dialog. 
         * Used for checking if the state has been altered 
         */  
        this.originalIsCritical = config.isCritical;
        this.selectedEffects = this.config.bonusEffects;
        this.selectedEphemerals = this.config.ephemerals;
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
            toggleSelectedEphemeral: this.toggleSelectedEphemeral,
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

    get actor() {
        return this.config?.data?.parent;
    }

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

        const { damageFormula, resourceFormulas } = this.roll.constructFormulas(this.config); 
        context.damageFormula = damageFormula;
        context.resourceFormulas = resourceFormulas;

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

        context.selectedEphemerals = this.selectedEphemerals;

        context.damageOptions = this.config.damageOptions;
        context.rangeOptions = CONFIG.DH.GENERAL.groupAttackRange;

        if (this.config.costs?.length) {
            const updatedCosts = game.system.api.fields.ActionFields.CostField.calcCosts.call(
                this.action ?? { actor: this.actor },
                this.config.costs
            );
            context.costs = updatedCosts.map(x => ({
                ...x,
                label: x.itemId
                    ? this.action.parent.parent.name
                    : game.i18n.localize(CONFIG.DH.GENERAL.abilityCosts[x.key].label)
            }));
            context.canRoll = game.system.api.fields.ActionFields.CostField.hasCost.call(
                this.action ?? { actor: this.actor },
                updatedCosts
            );
            this.config.data.scale = this.config.costs[0].total;
        }

        return context;
    }

    static updateRollConfiguration(_event, _, formData) {
        const data = foundry.utils.expandObject(formData.object);

        if (this.config.damageFormula) 
            foundry.utils.mergeObject(this.config.damageFormula, data.damageFormula);
        
        foundry.utils.mergeObject(this.config.resourceFormulas, data.resourceFormulas);
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

    static toggleSelectedEphemeral(_event, button) {
        const ephemeral = this.selectedEphemerals[button.dataset.index];
        ephemeral.selected = !ephemeral.selected;

        this.config.costs =
            this.config.costs.some(c => c.ephKey === ephemeral.id)
                ? this.config.costs.filter(x => x.ephKey !== ephemeral.id)
                : [
                    ...this.config.costs,
                    ...ephemeral.costs.map(c => ({
                        ephKey: ephemeral.id,
                        key: c.type,
                        value: c.value,
                        name: ephemeral.name
                    }))
                ];

        this.render();
    }

    static async submitRoll() {
        /* Sideeffect occuring in constructFormulas that sets this.config.isCritical to the false value. Can remove the below if it can be prevented */
        const sideEffectSafeIsCritical = this.config.isCritical;
        const { damageFormula, resourceFormulas } = this.roll.constructFormulas({ ...this.config, isCritical: false }); 

        this.config.isCritical = sideEffectSafeIsCritical;

        /* If the isCritical state has been altered in the dialog, we update the roll options */
        if (this.config.isCritical !== this.originalIsCritical) {
            damageFormula.roll.options.isCritical = this.config.isCritical;

            for (const formula of resourceFormulas)
                formula.roll.optionsisCritical = this.config.isCritical;
        }

        this.config.damageFormula = damageFormula;
        this.config.resourceFormulas = resourceFormulas;
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
