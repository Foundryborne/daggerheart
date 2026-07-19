import { triggerChatRollFx } from '../../helpers/utils.mjs';

export class ChatDamageData extends foundry.abstract.DataModel {
    constructor(data = {}, options = {}) {
        super(data, options);
        
        this._prepareRolls();
    }

    get isCritical() {
        if (!this.parent?.parent) return false;

        const roll = Roll.fromJSON(this.parent.parent._source.rolls[0]);
        return roll.isCritical;
    }

    static defineSchema() {
        const fields = foundry.data.fields;
        
        return {
            main: new fields.JSONField({ nullable: true, validate: ChatDamageData.#validateRoll}),
            resources: new fields.TypedObjectField(new fields.JSONField({validate: ChatDamageData.#validateRoll}))
        };
    }

    get active() {
        return !!this.main || Boolean(Object.keys(this.resources).length);
    }

    static #validateRoll(rollJSON) {
        if (rollJSON) {
            const roll = JSON.parse(rollJSON);
            if (!roll.evaluated) throw new Error('Roll objects added to ChatMessage documents must be evaluated');
        }
    }

    _prepareRolls() {
        this.main &&= Roll.fromData({ 
            ...this.main, 
            options: { 
                ...this.main.options, 
                isCritical: this.main.options.isCritical || this.isCritical 
            } 
        });

        for (const key of Object.keys(this.resources)) {
            this.resources[key] = Roll.fromData(this.resources[key]);
        }
    }

    async rerollDamageDie(isResource, damageType, dice, resultIndex) {
        const reroll = isResource ? this.resources[damageType] : this.main;
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