import { triggerChatRollFx } from '../../helpers/utils.mjs';

export class ChatDamageData extends foundry.abstract.DataModel {
    constructor(data = {}, options = {}) {
        super(data, options);
        
        this._prepareRolls();
    }

    static defineSchema() {
        const fields = foundry.data.fields;
        
        return {
            damage: new fields.JSONField({validate: ChatDamageData.#validateRoll}),
            resources: new fields.TypedObjectField(new fields.JSONField({validate: ChatDamageData.#validateRoll}))
        };
    }

    get active() {
        return Boolean(Object.keys(this.types).length);
    }

    static #validateRoll(rollJSON) {
        const roll = JSON.parse(rollJSON);
        if (!roll.evaluated) throw new Error('Roll objects added to ChatMessage documents must be evaluated');
    }

    _prepareRolls() {
        for (const key of Object.keys(this.types)) {
            const type = this.types[key];
            try {
                this.types[key] = Roll.fromData(type);
                this.types[key].options.modifierTotal = CONFIG.Dice.daggerheart.DHRoll.calculateTotalModifiers(type);
            } catch {}
        }
    }

    async rerollDamageDie(damageType, dice, resultIndex) {
        const reroll = this.types[damageType];
        const rerollDice = reroll.dice[dice];
        await rerollDice.rerollResult(resultIndex);
        await reroll._evaluate();
    
        const rerolledResult = rerollDice.results[rerollDice.results.length - 1];
        if (rerolledResult) {
            const fakeRoll = {
                _evaluated: true,
                dice: [new foundry.dice.terms.Die({
                    ...rerollDice,
                    results: [rerolledResult],
                    total: rerolledResult.value,
                    faces: rerollDice.faces
                })],
                options: { appearance: {} }
            };
            await triggerChatRollFx([fakeRoll]);
        }
    }
}