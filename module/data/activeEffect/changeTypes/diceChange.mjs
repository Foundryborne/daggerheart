import { diceTypes } from '../../../config/generalConfig.mjs';

const fields = foundry.data.fields;
export default class DiceChange extends foundry.abstract.DataModel {
    #single = false;

    static defineSchema() {
        return {
            type: new fields.StringField({ required: true, choices: ['dice'], initial: 'dice' }),
            key: new fields.StringField(),
            priority: new fields.NumberField({
                label: 'EFFECT.FIELDS.changes.element.priority.label',
                required: true, 
                integer: true, 
                initial: 20
            }),
            phase: new fields.StringField({ required: true, blank: false, initial: 'initial' }),
            value: new fields.StringField(),
            diceMode: new fields.StringField({
                required: true,
                nullabel: false,
                choices: CONFIG.DH.EFFECTS.diceMode,
                initial: CONFIG.DH.EFFECTS.diceMode.upgrade.id
            })
        };
    }

    get single() {
        return this.#single;
    }

    static changeEffect = {
        label: 'Dice',
        defaultPriority: 20,
        handler: (actor, change, _options, _field, replacementData) => {
            if (!change.key) return;

            const current = foundry.utils.getProperty(actor, change.key);
            let newDice;
            switch (change.diceMode) {
                case CONFIG.DH.EFFECTS.diceMode.upgrade.id:
                case CONFIG.DH.EFFECTS.diceMode.downgrade.id:
                    newDice = this.#getUpdatedDice(current, change.value, change.diceMode);
                    if (newDice === false) return;
                    break;
                case CONFIG.DH.EFFECTS.diceMode.override.id:
                    if (!diceTypes[change.value]) return;

                    newDice = change.value;
                    break;
                default:
                    return;
            }

            game.system.api.documents.DhActiveEffect.applyChange(
                actor,
                {
                    ...change,
                    type: 'override',
                    value: newDice
                },
                replacementData
            );
        },
        render: null
    };

    static #getUpdatedDice(value, delta, direction) {
        const deltaNumber = Number.parseInt(delta);
        if (!diceTypes[value] || Number.isNaN(deltaNumber)) return false;

        const diceKeys = Object.keys(diceTypes);
        const currentIndex = diceKeys.indexOf(value);
        const changedIndex = direction === 'upgrade' ? (currentIndex + deltaNumber) : (currentIndex - deltaNumber);
        const newIndex = Math.max(0, Math.min(changedIndex, Object.keys(diceTypes).length - 1));

        return diceKeys[newIndex];
    }

    static getInitialValue() {
        return {
            type: CONFIG.DH.EFFECTS.customChangeTypes.dice.id,
            value: 0,
            diceMode: CONFIG.DH.EFFECTS.diceMode.modify.id,
            phase: 'initial',
            priority: 20
        };
    }
}
