import D20RollDialog from '../applications/dialogs/d20RollDialog.mjs';
import D20Roll from './d20Roll.mjs';
import { parseRallyDice, setDiceSoNiceForDualityRoll } from '../helpers/utils.mjs';

export default class DualityRoll extends D20Roll {
    _advantageFaces = 6;
    _advantageNumber = 1;
    _rallyIndex;

    constructor(formula, data = {}, options = {}) {
        super(formula, data, options);
        this.rallyChoices = this.setRallyChoices();
        this.guaranteedCritical = options.guaranteedCritical;
    }

    static messageType = 'dualityRoll';

    static DefaultDialog = D20RollDialog;

    get title() {
        return game.i18n.localize(
            `DAGGERHEART.GENERAL.${this.options?.actionType === 'reaction' ? 'reactionRoll' : 'dualityRoll'}`
        );
    }

    get dHope() {
        if (!(this.dice[0] instanceof game.system.api.dice.diceTypes.HopeDie)) this.createBaseDice();
        return this.dice[0];
    }

    set dHope(faces) {
        // TODO this should not be asymmetrical with the getter. updateRollConfiguration() should use dHope.faces
        this.dHope.faces = this.getFaces(faces);
    }

    get dFear() {
        if (!(this.dice[1] instanceof game.system.api.dice.diceTypes.FearDie)) this.createBaseDice();
        return this.dice[1];
    }

    set dFear(faces) {
        // TODO this should not be asymmetrical with the getter. updateRollConfiguration() should use dFear.faces
        this.dFear.faces = this.getFaces(faces);
    }

    get dAdvantage() {
        return this.dice[2] instanceof game.system.api.dice.diceTypes.AdvantageDie ? this.dice[2] : null;
    }

    get dDisadvantage() {
        return this.dice[2] instanceof game.system.api.dice.diceTypes.DisadvantageDie ? this.dice[2] : null;
    }

    get advantageFaces() {
        return this._advantageFaces;
    }

    set advantageFaces(faces) {
        this._advantageFaces = this.getFaces(faces);
    }

    get advantageNumber() {
        return this._advantageNumber;
    }

    set advantageNumber(value) {
        this._advantageNumber = Number(value);
    }

    get extraDice() {
        const { HopeDie, FearDie, AdvantageDie, DisadvantageDie } = game.system.api.dice.diceTypes;
        return this.dice.filter(x => ![HopeDie, FearDie, AdvantageDie, DisadvantageDie].some(die => x instanceof die));
    }

    setRallyChoices() {
        return this.data?.parent?.appliedEffects.reduce((a, c) => {
            const change = c.system.changes.find(ch => ch.key === 'system.bonuses.rally');
            if (change) a.push({ value: c.id, label: parseRallyDice(change.value, c) });
            return a;
        }, []);
    }

    get dRally() {
        if (!this.rallyFaces) return null;
        if (this.hasDisadvantage || this.hasAdvantage) return this.dice[3];
        else return this.dice[2];
    }

    get rallyFaces() {
        const rallyChoice = this.rallyChoices?.find(r => r.value === this._rallyIndex)?.label;
        return rallyChoice ? this.getFaces(rallyChoice) : null;
    }

    get isCritical() {
        if (this.guaranteedCritical) return true;
        if (!this.dHope._evaluated || !this.dFear._evaluated) return;
        return this.dHope.total === this.dFear.total;
    }

    get withHope() {
        if (!this._evaluated || this.guaranteedCritical) return;
        return this.dHope.total > this.dFear.total;
    }

    get withFear() {
        if (!this._evaluated || this.guaranteedCritical) return;
        return this.dHope.total < this.dFear.total;
    }

    get totalLabel() {
        const label = this.guaranteedCritical
            ? 'DAGGERHEART.GENERAL.guaranteedCriticalSuccess'
            : this.isCritical
              ? 'DAGGERHEART.GENERAL.criticalSuccess'
              : this.withHope
                ? 'DAGGERHEART.GENERAL.hope'
                : 'DAGGERHEART.GENERAL.fear';

        return game.i18n.localize(label);
    }

    static getHooks(hooks) {
        return [...(hooks ?? []), 'Duality'];
    }

    /** @inheritDoc */
    static fromData(data) {
        data.terms[0].class = 'HopeDie';
        data.terms[2].class = 'FearDie';
        if (data.options.roll.advantage?.type && data.terms[4]?.faces) {
            data.terms[4].class = data.options.roll.advantage.type === 1 ? 'AdvantageDie' : 'DisadvantageDie';
        }
        return super.fromData(data);
    }

    createBaseDice() {
        if (
            this.dice[0] instanceof game.system.api.dice.diceTypes.HopeDie &&
            this.dice[1] instanceof game.system.api.dice.diceTypes.FearDie
        ) {
            this.terms = [this.terms[0], this.terms[1], this.terms[2]];
            return;
        }

        this.terms[0] = new game.system.api.dice.diceTypes.HopeDie({
            faces: this.data.rules.dualityRoll?.defaultHopeDice ?? 12
        });
        this.terms[1] = new foundry.dice.terms.OperatorTerm({ operator: '+' });
        this.terms[2] = new game.system.api.dice.diceTypes.FearDie({
            faces: this.data.rules.dualityRoll?.defaultFearDice ?? 12
        });
    }

    applyAdvantage() {
        if (this.hasAdvantage || this.hasDisadvantage) {
            const dieFaces = this.advantageFaces,
                advDie = new foundry.dice.terms.Die({ faces: dieFaces, number: this.advantageNumber });
            if (this.advantageNumber > 1) advDie.modifiers = ['kh'];
            this.terms.push(
                new foundry.dice.terms.OperatorTerm({ operator: this.hasDisadvantage ? '-' : '+' }),
                advDie
            );
        }
        if (this.rallyFaces)
            this.terms.push(
                new foundry.dice.terms.OperatorTerm({ operator: this.hasDisadvantage ? '-' : '+' }),
                new foundry.dice.terms.Die({ faces: this.rallyFaces })
            );
    }

    applyBaseBonus() {
        const modifiers = super.applyBaseBonus();

        if (this.options.roll.trait && this.data.traits?.[this.options.roll.trait])
            modifiers.unshift({
                label:
                    this.options.roll.type === CONFIG.DH.GENERAL.rollTypes.spellcast.id
                        ? 'DAGGERHEART.CONFIG.RollTypes.spellcast.name'
                        : `DAGGERHEART.CONFIG.Traits.${this.options.roll.trait}.name`,
                value: this.data.traits[this.options.roll.trait].value
            });

        const weapons = ['primaryWeapon', 'secondaryWeapon'];
        weapons.forEach(w => {
            if (this.options.source.item && this.options.source.item === this.data[w]?.id)
                modifiers.push(...this.getBonus(`roll.${w}`, 'Weapon Bonus'));
        });

        return modifiers;
    }

    static async buildConfigure(config = {}, message = {}) {
        config.dialog ??= {};
        config.guaranteedCritical = config.data?.parent?.appliedEffects.reduce((a, c) => {
            const change = c.system.changes.find(ch => ch.key === 'system.rules.roll.guaranteedCritical');
            if (change) a = true;
            return a;
        }, false);

        if (config.guaranteedCritical) {
            config.dialog.configure = false;
        }

        return super.buildConfigure(config, message);
    }

    getActionChangeKeys() {
        const changeKeys = new Set([`system.bonuses.roll.${this.options.actionType}`]);

        if (this.options.roll.type !== CONFIG.DH.GENERAL.rollTypes.attack.id) {
            changeKeys.add(`system.bonuses.roll.${this.options.roll.type}`);
        }

        if (
            this.options.roll.type === CONFIG.DH.GENERAL.rollTypes.attack.id ||
            (this.options.roll.type === CONFIG.DH.GENERAL.rollTypes.spellcast.id && this.options.hasDamage)
        ) {
            changeKeys.add(`system.bonuses.roll.attack`);
        }

        if (this.options.roll.trait && this.data.traits?.[this.options.roll.trait]) {
            if (this.options.roll.type !== CONFIG.DH.GENERAL.rollTypes.spellcast.id)
                changeKeys.add('system.bonuses.roll.trait');
        }

        const weapons = ['primaryWeapon', 'secondaryWeapon'];
        weapons.forEach(w => {
            if (this.options.source.item && this.options.source.item === this.data[w]?.id)
                changeKeys.add(`system.bonuses.roll.${w}`);
        });

        return changeKeys;
    }

    static async buildEvaluate(roll, config = {}, message = {}) {
        await super.buildEvaluate(roll, config, message);

        await setDiceSoNiceForDualityRoll(
            roll,
            config.roll.advantage.type,
            config.roll.hope.dice,
            config.roll.fear.dice,
            config.roll.advantage.dice
        );
    }

    static postEvaluate(roll, config = {}) {
        const data = super.postEvaluate(roll, config);

        data.hope = {
            dice: roll.dHope.denomination,
            value: this.guaranteedCritical ? 0 : roll.dHope.total,
            rerolled: {
                any: roll.dHope.results.some(x => x.rerolled),
                rerolls: roll.dHope.results.filter(x => x.rerolled)
            }
        };
        data.fear = {
            dice: roll.dFear.denomination,
            value: this.guaranteedCritical ? 0 : roll.dFear.total,
            rerolled: {
                any: roll.dFear.results.some(x => x.rerolled),
                rerolls: roll.dFear.results.filter(x => x.rerolled)
            }
        };
        data.rally = {
            dice: roll.dRally?.denomination,
            value: roll.dRally?.total
        };
        data.result = {
            duality: roll.withHope ? 1 : roll.withFear ? -1 : 0,
            total: this.guaranteedCritical ? 0 : roll.dHope.total + roll.dFear.total,
            label: roll.totalLabel
        };

        if (roll._rallyIndex && roll.data?.parent)
            roll.data.parent.deleteEmbeddedDocuments('ActiveEffect', [roll._rallyIndex]);

        return data;
    }

    static async buildPost(roll, config, message) {
        await super.buildPost(roll, config, message);

        await DualityRoll.dualityUpdate(config);
        await DualityRoll.handleTriggers(roll, config);
    }

    static async handleTriggers(roll, config) {
        if (!config.source?.actor || config.skips?.triggers) return;

        const updates = [];
        const dualityUpdates = await game.system.registeredTriggers.runTrigger(
            CONFIG.DH.TRIGGER.triggers.dualityRoll.id,
            roll.data?.parent,
            roll,
            roll.data?.parent
        );
        if (dualityUpdates?.length) updates.push(...dualityUpdates);

        if (config.roll.result.duality === -1) {
            const fearUpdates = await game.system.registeredTriggers.runTrigger(
                CONFIG.DH.TRIGGER.triggers.fearRoll.id,
                roll.data?.parent,
                roll,
                roll.data?.parent
            );
            if (fearUpdates?.length) updates.push(...fearUpdates);
        }

        config.resourceUpdates.addResources(updates);
    }

    static async addDualityResourceUpdates(config) {
        const automationSettings = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation);
        const hopeFearAutomation = automationSettings.hopeFear;
        if (
            !config.source?.actor ||
            (game.user.isGM ? !hopeFearAutomation.gm : !hopeFearAutomation.players) ||
            config.actionType === 'reaction' ||
            config.skips?.resources
        )
            return;
        const actor = await fromUuid(config.source.actor);
        let updates = [];
        if (!actor) return;

        if (config.rerolledRoll) {
            if (config.roll.result.duality != config.rerolledRoll.result.duality) {
                const hope =
                    (config.roll.isCritical || config.roll.result.duality === 1 ? 1 : 0) -
                    (config.rerolledRoll.isCritical || config.rerolledRoll.result.duality === 1 ? 1 : 0);
                const stress = (config.roll.isCritical ? 1 : 0) - (config.rerolledRoll.isCritical ? 1 : 0);
                const fear =
                    (config.roll.result.duality === -1 ? 1 : 0) - (config.rerolledRoll.result.duality === -1 ? 1 : 0);

                if (hope !== 0) updates.push({ key: 'hope', value: hope, total: -1 * hope, enabled: true });
                if (stress !== 0) updates.push({ key: 'stress', value: -1 * stress, total: stress, enabled: true });
                if (fear !== 0) updates.push({ key: 'fear', value: fear, total: -1 * fear, enabled: true });
            }
        } else {
            if (config.roll.isCritical || config.roll.result.duality === 1)
                updates.push({ key: 'hope', value: 1, total: -1, enabled: true });
            if (config.roll.isCritical) updates.push({ key: 'stress', value: -1, total: 1, enabled: true });
            if (config.roll.result.duality === -1) updates.push({ key: 'fear', value: 1, total: -1, enabled: true });
        }

        if (updates.length) {
            // const target = actor.system.partner ?? actor;
            if (!['dead', 'defeated', 'unconscious'].some(x => actor.statuses.has(x))) {
                config.resourceUpdates.addResources(updates);
            }
        }
    }

    static async dualityUpdate(config) {
        const automationSettings = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation);
        if (
            automationSettings.countdownAutomation &&
            config.actionType !== 'reaction' &&
            !config.skips?.updateCountdowns
        ) {
            const { updateCountdowns } = game.system.api.applications.ui.DhCountdowns;

            if (config.roll.result.duality === -1) {
                await updateCountdowns(
                    CONFIG.DH.GENERAL.countdownProgressionTypes.actionRoll.id,
                    CONFIG.DH.GENERAL.countdownProgressionTypes.fear.id
                );
            } else {
                await updateCountdowns(CONFIG.DH.GENERAL.countdownProgressionTypes.actionRoll.id);
            }
        }

        await DualityRoll.addDualityResourceUpdates(config);

        if (!config.roll.hasOwnProperty('success') && !config.targets?.length) return;

        const rollResult = config.roll.success || config.targets?.some(t => t.hit),
            looseSpotlight = !rollResult || config.roll.result.duality === -1;

        if (looseSpotlight && game.combat?.active) {
            const currentCombatant = game.combat.combatants.get(game.combat.current?.combatantId);
            if (currentCombatant?.actorId == config.data.id) ui.combat.setCombatantSpotlight(currentCombatant.id);
        }
    }
}
