import D20RollDialog from '../applications/dialogs/d20RollDialog.mjs';
import D20Roll from './d20Roll.mjs';
import { setDiceSoNiceForDualityRoll } from '../helpers/utils.mjs';
import { getDiceSoNicePresets } from '../config/generalConfig.mjs';
import { ResourceUpdateMap } from '../data/action/baseAction.mjs';

export default class DualityRoll extends D20Roll {
    _advantageFaces = 6;
    _advantageNumber = 1;
    _rallyIndex;

    constructor(formula, data = {}, options = {}) {
        super(formula, data, options);
        this.rallyChoices = this.setRallyChoices();
    }

    static messageType = 'dualityRoll';

    static DefaultDialog = D20RollDialog;

    get title() {
        return game.i18n.localize(
            `DAGGERHEART.GENERAL.${this.options?.actionType === 'reaction' ? 'reactionRoll' : 'dualityRoll'}`
        );
    }

    get dHope() {
        // if ( !(this.terms[0] instanceof foundry.dice.terms.Die) ) return;
        if (!(this.dice[0] instanceof foundry.dice.terms.Die)) this.createBaseDice();
        return this.dice[0];
        // return this.#hopeDice;
    }

    set dHope(faces) {
        if (!(this.dice[0] instanceof foundry.dice.terms.Die)) this.createBaseDice();
        this.terms[0].faces = this.getFaces(faces);
        // this.#hopeDice = `d${face}`;
    }

    get dFear() {
        // if ( !(this.terms[1] instanceof foundry.dice.terms.Die) ) return;
        if (!(this.dice[1] instanceof foundry.dice.terms.Die)) this.createBaseDice();
        return this.dice[1];
        // return this.#fearDice;
    }

    set dFear(faces) {
        if (!(this.dice[1] instanceof foundry.dice.terms.Die)) this.createBaseDice();
        this.dice[1].faces = this.getFaces(faces);
        // this.#fearDice = `d${face}`;
    }

    get dAdvantage() {
        return this.dice[2];
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

    setRallyChoices() {
        return this.data?.parent?.appliedEffects.reduce((a, c) => {
            const change = c.changes.find(ch => ch.key === 'system.bonuses.rally');
            if (change) a.push({ value: c.id, label: change.value });
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
        if (!this.dHope._evaluated || !this.dFear._evaluated) return;
        return this.dHope.total === this.dFear.total;
    }

    get withHope() {
        if (!this._evaluated) return;
        return this.dHope.total > this.dFear.total;
    }

    get withFear() {
        if (!this._evaluated) return;
        return this.dHope.total < this.dFear.total;
    }

    get totalLabel() {
        const label = this.withHope
            ? 'DAGGERHEART.GENERAL.hope'
            : this.withFear
              ? 'DAGGERHEART.GENERAL.fear'
              : 'DAGGERHEART.GENERAL.criticalSuccess';

        return game.i18n.localize(label);
    }

    static getHooks(hooks) {
        return [...(hooks ?? []), 'Duality'];
    }

    /** @inheritDoc */
    static fromData(data) {
        data.terms[0].class = foundry.dice.terms.Die.name;
        data.terms[2].class = foundry.dice.terms.Die.name;
        return super.fromData(data);
    }

    createBaseDice() {
        if (this.dice[0] instanceof foundry.dice.terms.Die && this.dice[1] instanceof foundry.dice.terms.Die) {
            this.terms = [this.terms[0], this.terms[1], this.terms[2]];
            return;
        }
        this.terms[0] = new foundry.dice.terms.Die({ faces: 12 });
        this.terms[1] = new foundry.dice.terms.OperatorTerm({ operator: '+' });
        this.terms[2] = new foundry.dice.terms.Die({ faces: 12 });
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
            value: roll.dHope.total,
            rerolled: {
                any: roll.dHope.results.some(x => x.rerolled),
                rerolls: roll.dHope.results.filter(x => x.rerolled)
            }
        };
        data.fear = {
            dice: roll.dFear.denomination,
            value: roll.dFear.total,
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
            total: roll.dHope.total + roll.dFear.total,
            label: roll.totalLabel
        };

        if (roll._rallyIndex && roll.data?.parent)
            roll.data.parent.deleteEmbeddedDocuments('ActiveEffect', [roll._rallyIndex]);

        return data;
    }

    static async buildPost(roll, config, message) {
        await super.buildPost(roll, config, message);

        await DualityRoll.dualityUpdate(config);
    }

    static async addDualityResourceUpdates(config) {
        const automationSettings = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation);
        const hopeFearAutomation = automationSettings.hopeFear;
        if (
            !config.source?.actor ||
            (game.user.isGM ? !hopeFearAutomation.gm : !hopeFearAutomation.players) ||
            config.actionType === 'reaction' ||
            config.tagTeamSelected ||
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
            !config.tagTeamSelected &&
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
            if (currentCombatant?.actorId == actor.id) ui.combat.setCombatantSpotlight(currentCombatant.id);
        }
    }

    static async reroll(rollString, target, message) {
        let parsedRoll = game.system.api.dice.DualityRoll.fromData({ ...rollString, evaluated: false });
        const term = parsedRoll.terms[target.dataset.dieIndex];
        await term.reroll(`/r1=${term.total}`);
        if (game.modules.get('dice-so-nice')?.active) {
            const diceSoNiceRoll = {
                _evaluated: true,
                dice: [
                    new foundry.dice.terms.Die({
                        ...term,
                        faces: term._faces,
                        results: term.results.filter(x => !x.rerolled)
                    })
                ],
                options: { appearance: {} }
            };

            const diceSoNicePresets = await getDiceSoNicePresets(`d${term._faces}`, `d${term._faces}`);
            const type = target.dataset.type;
            if (diceSoNicePresets[type]) {
                diceSoNiceRoll.dice[0].options = diceSoNicePresets[type];
            }

            await game.dice3d.showForRoll(diceSoNiceRoll, game.user, true);
        }

        await parsedRoll.evaluate();

        const newRoll = game.system.api.dice.DualityRoll.postEvaluate(parsedRoll, {
            targets: message.system.targets,
            roll: {
                advantage: message.system.roll.advantage?.type,
                difficulty: message.system.roll.difficulty ? Number(message.system.roll.difficulty) : null
            }
        });
        newRoll.extra = newRoll.extra.slice(2);

        const tagTeamSettings = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.TagTeamRoll);

        const actor = message.system.source.actor ? await foundry.utils.fromUuid(message.system.source.actor) : null;
        const config = {
            source: { actor: message.system.source.actor ?? '' },
            targets: message.system.targets,
            tagTeamSelected: Object.values(tagTeamSettings.members).some(x => x.messageId === message._id),
            roll: newRoll,
            rerolledRoll: message.system.roll,
            resourceUpdates: new ResourceUpdateMap(actor)
        };

        await DualityRoll.addDualityResourceUpdates(config);
        await config.resourceUpdates.updateResources();

        return { newRoll, parsedRoll };
    }
}
