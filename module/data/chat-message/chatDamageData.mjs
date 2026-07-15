import { triggerChatRollFx } from '../../helpers/utils.mjs';

export class ChatDamageData extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        
        return {
            types: new fields.TypedObjectField(new fields.SchemaField({
                roll: new fields.JSONField({validate: ChatDamageData.#validateRoll}),
                damageTypes: new fields.ArrayField(new fields.StringField({ choices: CONFIG.DH.GENERAL.damageTypes }))
            }))
        };
    }

    get active() {
        return Boolean(Object.keys(this.types).length);
    }

    static #validateRoll(rollJSON) {
        const roll = JSON.parse(rollJSON);
        if (!roll.evaluated) throw new Error('Roll objects added to ChatMessage documents must be evaluated');
    }

    prepareRolls() {
        for (const key of Object.keys(this.types)) {
            const type = this.types[key];
            try {
                const roll = Roll.fromData(type.roll);
                type.roll = roll;
                type.roll.modifierTotal = CONFIG.Dice.daggerheart.DHRoll.calculateTotalModifiers(roll);
            } catch {}
        }
    }

    async rerollDamageDie(damageType, dice, resultIndex) {
        const reroll = this.types[damageType].roll;
        const rerollDice = reroll.dice[dice];
        const diceResult = rerollDice.results[resultIndex];
        await rerollDice.reroll(`/r1=${diceResult.result}`);
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