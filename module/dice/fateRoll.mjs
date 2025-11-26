import D20RollDialog from '../applications/dialogs/d20RollDialog.mjs';
import D20Roll from './d20Roll.mjs';
import { setDiceSoNiceForFateRoll } from '../helpers/utils.mjs';

export default class FateRoll extends D20Roll {
     constructor(formula, data = {}, options = {}) {
        super(formula, data, options);
    }

    static messageType = 'fateRoll';

    static DefaultDialog = D20RollDialog;

    get title() {
        return game.i18n.localize(
            `DAGGERHEART.GENERAL.fateRoll`
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

    get isCritical() {
        return false;
    }

    static getHooks(hooks) {
        return [...(hooks ?? []), 'Fate'];
    }

    /** @inheritDoc */
    static fromData(data) {
        data.terms[0].class = foundry.dice.terms.Die.name;
        return super.fromData(data);
    }

    createBaseDice() {
        if (this.dice[0] instanceof foundry.dice.terms.Die) {
            this.terms = [this.terms[0]];
            return;
        }
        this.terms[0] = new foundry.dice.terms.Die({ faces: 12 });
    }

    static async buildEvaluate(roll, config = {}, message = {}) {
        await super.buildEvaluate(roll, config, message);

        await setDiceSoNiceForFateRoll(
            roll,
            config.roll.hope.dice
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

        return data;
    }

    // static async reroll(rollString, target, message) {
    //     let parsedRoll = game.system.api.dice.DualityRoll.fromData({ ...rollString, evaluated: false });
    //     const term = parsedRoll.terms[target.dataset.dieIndex];
    //     await term.reroll(`/r1=${term.total}`);
    //     if (game.modules.get('dice-so-nice')?.active) {
    //         const diceSoNiceRoll = {
    //             _evaluated: true,
    //             dice: [
    //                 new foundry.dice.terms.Die({
    //                     ...term,
    //                     faces: term._faces,
    //                     results: term.results.filter(x => !x.rerolled)
    //                 })
    //             ],
    //             options: { appearance: {} }
    //         };

    //         const diceSoNicePresets = await getDiceSoNicePresets(`d${term._faces}`, `d${term._faces}`);
    //         const type = target.dataset.type;
    //         if (diceSoNicePresets[type]) {
    //             diceSoNiceRoll.dice[0].options = diceSoNicePresets[type];
    //         }

    //         await game.dice3d.showForRoll(diceSoNiceRoll, game.user, true);
    //     }

    //     await parsedRoll.evaluate();

    //     const newRoll = game.system.api.dice.DualityRoll.postEvaluate(parsedRoll, {
    //         targets: message.system.targets,
    //         roll: {
    //             advantage: message.system.roll.advantage?.type,
    //             difficulty: message.system.roll.difficulty ? Number(message.system.roll.difficulty) : null
    //         }
    //     });
    //     newRoll.extra = newRoll.extra.slice(2);

    //     const tagTeamSettings = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.TagTeamRoll);
    //     Hooks.call(`${CONFIG.DH.id}.postRollDuality`, {
    //         source: { actor: message.system.source.actor ?? '' },
    //         targets: message.system.targets,
    //         tagTeamSelected: Object.values(tagTeamSettings.members).some(x => x.messageId === message._id),
    //         roll: newRoll,
    //         rerolledRoll:
    //             newRoll.result.duality !== message.system.roll.result.duality ? message.system.roll : undefined
    //     });
    //     return { newRoll, parsedRoll };
    // }
}
