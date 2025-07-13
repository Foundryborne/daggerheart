import D20RollDialog from '../applications/dialogs/d20RollDialog.mjs';

export default class DHRoll extends Roll {
    baseTerms = [];
    constructor(formula, data, options) {
        super(formula, data, options);
    }

    static messageType = 'adversaryRoll';

    static DefaultDialog = D20RollDialog;

    static async build(config = {}, message = {}) {
        const roll = await this.buildConfigure(config, message);
        if (!roll) return;
        await this.buildEvaluate(roll, config, (message = {}));
        await this.buildPost(roll, config, (message = {}));
        return config;
    }

    static async buildConfigure(config = {}, message = {}) {
        config.hooks = [...this.getHooks(), ''];
        config.dialog ??= {};
        for (const hook of config.hooks) {
            if (Hooks.call(`${CONFIG.DH.id}.preRoll${hook.capitalize()}`, config, message) === false) return null;
        }

        this.applyKeybindings(config);

        let roll = new this(config.roll.formula, config.data, config);
        if (config.dialog.configure !== false) {
            // Open Roll Dialog
            const DialogClass = config.dialog?.class ?? this.DefaultDialog;
            const configDialog = await DialogClass.configure(roll, config, message);
            if (!configDialog) return;
        }

        for (const hook of config.hooks) {
            if (
                Hooks.call(`${CONFIG.DH.id}.post${hook.capitalize()}RollConfiguration`, roll, config, message) === false
            )
                return [];
        }
        return roll;
    }

    static async buildEvaluate(roll, config = {}, message = {}) {
        if (config.evaluate !== false) await roll.evaluate();
        this.postEvaluate(roll, config);
    }

    static async buildPost(roll, config, message) {
        for (const hook of config.hooks) {
            if (Hooks.call(`${CONFIG.DH.id}.postRoll${hook.capitalize()}`, config, message) === false) return null;
        }

        // Create Chat Message
        if (config.source?.message) {
            if (game.modules.get('dice-so-nice')?.active) await game.dice3d.showForRoll(roll, game.user, true);
        } else {
            config.message = await this.toMessage(roll, config);
        }
    }

    static postEvaluate(roll, config = {}) {
        if (!config.roll) config.roll = {};
        config.roll.total = roll.total;
        config.roll.formula = roll.formula;
        config.roll.dice = [];
        roll.dice.forEach(d => {
            config.roll.dice.push({
                dice: d.denomination,
                total: d.total,
                formula: d.formula,
                results: d.results
            });
        });
    }

    static async toMessage(roll, config) {
        const cls = getDocumentClass('ChatMessage'),
            msg = {
                type: this.messageType,
                user: game.user.id,
                sound: config.mute ? null : CONFIG.sounds.dice,
                system: config,
                rolls: [roll]
            };
        return await cls.create(msg);
    }

    static applyKeybindings(config) {
        if (config.event)
            config.dialog.configure ??= !(config.event.shiftKey || config.event.altKey || config.event.ctrlKey);
    }

    static getHooks(hooks) {
        return hooks ?? [];
    }

    formatModifier(modifier) {
        const numTerm = modifier < 0 ? '-' : '+';
        return [
            new foundry.dice.terms.OperatorTerm({ operator: numTerm }),
            new foundry.dice.terms.NumericTerm({ number: Math.abs(modifier) })
        ];
    }

    getFaces(faces) {
        return Number(faces.startsWith('d') ? faces.replace('d', '') : faces);
    }

    constructFormula(config) {
        this.terms = Roll.parse(this.options.roll.formula, config.data);

        if (this.options.extraFormula) {
            this.terms.push(
                new foundry.dice.terms.OperatorTerm({ operator: '+' }),
                ...this.constructor.parse(this.options.extraFormula, this.options.data)
            );
        }
        return (this._formula = this.constructor.getFormula(this.terms));
    }

    static calculateTotalModifiers(roll) {
        let modifierTotal = 0;
        for (let i = 0; i < roll.terms.length; i++) {
            if (
                roll.terms[i] instanceof foundry.dice.terms.NumericTerm &&
                !!roll.terms[i - 1] &&
                roll.terms[i - 1] instanceof foundry.dice.terms.OperatorTerm
            )
                modifierTotal += Number(`${roll.terms[i - 1].operator}${roll.terms[i].total}`);
        }
        return modifierTotal;
    }
}

export const registerRollDiceHooks = () => {
    Hooks.on(`${CONFIG.DH.id}.postRollDuality`, async (config, message) => {
        if (
            !config.source?.actor ||
            !game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).hope ||
            config.roll.type === 'reaction'
        )
            return;

        const actor = await fromUuid(config.source.actor),
            updates = [];
        if (!actor) return;
        if (config.roll.isCritical || config.roll.result.duality === 1) updates.push({ type: 'hope', value: 1 });
        if (config.roll.isCritical) updates.push({ type: 'stress', value: -1 });
        if (config.roll.result.duality === -1) updates.push({ type: 'fear', value: 1 });

        if (updates.length) actor.modifyResource(updates);

        if (!config.roll.hasOwnProperty('success') && !config.targets?.length) return;

        const rollResult = config.roll.success || config.targets.some(t => t.hit),
            looseSpotlight = !rollResult || config.roll.result.duality === -1;

        if (looseSpotlight && game.combat?.active) {
            const currentCombatant = game.combat.combatants.get(game.combat.current?.combatantId);
            if (currentCombatant?.actorId == actor.id) ui.combat.setCombatantSpotlight(currentCombatant.id);
        }
    });
};
