import DamageDialog from '../applications/dialogs/damageDialog.mjs';
import DHRoll from './dhRoll.mjs';

export default class DamageRoll extends DHRoll {
    constructor(formula, data = {}, options = {}) {
        super(formula, data, options);
    }

    static DefaultDialog = DamageDialog;

    static async buildEvaluate(roll, config = {}, message = {}) {
        if (config.evaluate !== false) for (const roll of config.roll) await roll.roll.evaluate();

        roll._evaluated = true;
        const parts = config.roll.map(r => this.postEvaluate(r));

        config.damage = this.unifyDamageRoll(parts);
    }

    static postEvaluate(roll, config = {}) {
        return {
            ...roll,
            ...super.postEvaluate(roll.roll, config),
            damageTypes: [...(roll.damageTypes ?? [])],
            roll: roll.roll,
            type: config.type,
            modifierTotal: this.calculateTotalModifiers(roll.roll)
        };
    }

    static async buildPost(roll, config, message) {
        const chatMessage = config.source?.message
            ? ui.chat.collection.get(config.source.message)
            : getDocumentClass('ChatMessage').applyRollMode({}, config.rollMode);
        if (game.modules.get('dice-so-nice')?.active) {
            const pool = foundry.dice.terms.PoolTerm.fromRolls(
                    Object.values(config.damage).flatMap(r => r.parts.map(p => p.roll))
                ),
                diceRoll = Roll.fromTerms([pool]);
            await game.dice3d.showForRoll(diceRoll, game.user, true, chatMessage.whisper, chatMessage.blind);
        }
        await super.buildPost(roll, config, message);
        if (config.source?.message) {
            chatMessage.update({ 'system.damage': config.damage });
        }
    }

    static unifyDamageRoll(rolls) {
        const unified = {};
        rolls.forEach(r => {
            const resource = unified[r.applyTo] ?? { formula: '', total: 0, parts: [] };
            resource.formula += `${resource.formula !== '' ? ' + ' : ''}${r.formula}`;
            resource.total += r.total;
            resource.parts.push(r);
            unified[r.applyTo] = resource;
        });
        return unified;
    }

    static formatGlobal(rolls) {
        let formula, total;
        const applyTo = new Set(rolls.flatMap(r => r.applyTo));
        if (applyTo.size > 1) {
            const data = {};
            rolls.forEach(r => {
                if (data[r.applyTo]) {
                    data[r.applyTo].formula += ` + ${r.formula}`;
                    data[r.applyTo].total += r.total;
                } else {
                    data[r.applyTo] = {
                        formula: r.formula,
                        total: r.total
                    };
                }
            });
            formula = Object.entries(data).reduce((a, [k, v]) => a + ` ${k}: ${v.formula}`, '');
            total = Object.entries(data).reduce((a, [k, v]) => a + ` ${k}: ${v.total}`, '');
        } else {
            formula = rolls.map(r => r.formula).join(' + ');
            total = rolls.reduce((a, c) => a + c.total, 0);
        }
        return { formula, total };
    }

    applyBaseBonus(part) {
        const modifiers = [],
            type = this.options.messageType ?? (this.options.hasHealing ? 'healing' : 'damage'),
            options = part ?? this.options;

        modifiers.push(...this.getBonus(`${type}`, `${type.capitalize()} Bonus`));
        if (!this.options.hasHealing) {
            options.damageTypes?.forEach(t => {
                modifiers.push(...this.getBonus(`${type}.${t}`, `${t.capitalize()} ${type.capitalize()} Bonus`));
            });
            const weapons = ['primaryWeapon', 'secondaryWeapon'];
            weapons.forEach(w => {
                if (this.options.source.item && this.options.source.item === this.data[w]?.id)
                    modifiers.push(...this.getBonus(`${type}.${w}`, 'Weapon Bonus'));
            });
        }

        return modifiers;
    }

    constructFormula(config) {
        this.options.roll.forEach((part, index) => {
            part.roll = new Roll(Roll.replaceFormulaData(part.formula, config.data));
            this.constructFormulaPart(config, part, index);
        });
        return this.options.roll;
    }

    constructFormulaPart(config, part, index) {
        part.roll.terms = Roll.parse(part.roll.formula, config.data);

        if (part.applyTo === CONFIG.DH.GENERAL.healingTypes.hitPoints.id) {
            part.modifiers = this.applyBaseBonus(part);
            this.addModifiers(part);
            part.modifiers?.forEach(m => {
                part.roll.terms.push(...this.formatModifier(m.value));
            });
        }

        /* To Remove When Reaction System */
        if (index === 0 && part.applyTo === CONFIG.DH.GENERAL.healingTypes.hitPoints.id) {
            for (const mod in config.modifiers) {
                const modifier = config.modifiers[mod];
                if (modifier.beforeCrit === true && (modifier.enabled || modifier.value)) modifier.callback(part);
            }
        }

        if (part.extraFormula) {
            part.roll.terms.push(
                new foundry.dice.terms.OperatorTerm({ operator: '+' }),
                ...this.constructor.parse(part.extraFormula, this.options.data)
            );
        }

        if (config.isCritical && part.applyTo === CONFIG.DH.GENERAL.healingTypes.hitPoints.id) {
            const tmpRoll = Roll.fromTerms(part.roll.terms)._evaluateSync({ maximize: true }),
                criticalBonus = tmpRoll.total - this.constructor.calculateTotalModifiers(tmpRoll);
            part.roll.terms.push(...this.formatModifier(criticalBonus));
        }

        /* To Remove When Reaction System */
        if (index === 0 && part.applyTo === CONFIG.DH.GENERAL.healingTypes.hitPoints.id) {
            for (const mod in config.modifiers) {
                const modifier = config.modifiers[mod];
                if (!modifier.beforeCrit && (modifier.enabled || modifier.value)) modifier.callback(part);
            }
        }

        return (part.roll._formula = this.constructor.getFormula(part.roll.terms));
    }

    /* To Remove When Reaction System */
    static temporaryModifierBuilder(config) {
        const mods = {};
        if (config.data?.parent) {
            if (config.data.parent.appliedEffects) {
                // Bardic Rally
                const rallyChoices = config.data?.parent?.appliedEffects.reduce((a, c) => {
                        const change = c.changes.find(ch => ch.key === 'system.bonuses.rally');
                        if (change) a.push({ value: c.id, label: change.value });
                        return a;
                    }, [])
                if(rallyChoices.length) {
                    mods.rally = {
                        label: 'DAGGERHEART.CLASS.Feature.rallyDice',
                        values: rallyChoices,
                        value: null,
                        beforeCrit: true,
                        callback: part => {
                            const rallyFaces = config.modifiers.rally.values.find(
                                r => r.value === config.modifiers.rally.value
                            )?.label;
                            part.roll.terms.push(
                                new foundry.dice.terms.OperatorTerm({ operator: '+' }),
                                ...this.parse(`1${rallyFaces}`)
                            );
                        }
                    };
                }
            }

            const item = config.data.parent.items?.get(config.source.item);
            if (item) {
                // Massive (Weapon Feature)
                if (item.system.itemFeatures.find(f => f.value === 'massive'))
                    mods.massive = {
                        label: CONFIG.DH.ITEM.weaponFeatures.massive.label,
                        enabled: true,
                        callback: part => {
                            part.roll.terms[0].modifiers.push(`kh${part.roll.terms[0].number}`);
                            part.roll.terms[0].number += 1;
                        }
                    };

                // Powerful (Weapon Feature)
                if (item.system.itemFeatures.find(f => f.value === 'powerful'))
                    mods.powerful = {
                        label: CONFIG.DH.ITEM.weaponFeatures.powerful.label,
                        enabled: true,
                        callback: part => {
                            part.roll.terms[0].modifiers.push(`kh${part.roll.terms[0].number}`);
                            part.roll.terms[0].number += 1;
                        }
                    };

                // Brutal (Weapon Feature)
                if (item.system.itemFeatures.find(f => f.value === 'brutal'))
                    mods.brutal = {
                        label: CONFIG.DH.ITEM.weaponFeatures.brutal.label,
                        enabled: true,
                        beforeCrit: true,
                        callback: part => {
                            part.roll.terms[0].modifiers.push(`x${part.roll.terms[0].faces}`);
                        }
                    };

                // Serrated (Weapon Feature)
                if (item.system.itemFeatures.find(f => f.value === 'serrated'))
                    mods.serrated = {
                        label: CONFIG.DH.ITEM.weaponFeatures.serrated.label,
                        enabled: true,
                        callback: part => {
                            part.roll.terms[0].modifiers.push(`sc8`);
                        }
                    };

                // Self-Correcting (Weapon Feature)
                if (item.system.itemFeatures.find(f => f.value === 'selfCorrecting'))
                    mods.selfCorrecting = {
                        label: CONFIG.DH.ITEM.weaponFeatures.selfCorrecting.label,
                        enabled: true,
                        callback: part => {
                            part.roll.terms[0].modifiers.push(`sc6`);
                        }
                    };
            }
        }

        config.modifiers = mods;
        return mods;
    }

    static async reroll(target, message) {
        const { damageType, part, dice, result } = target.dataset;
        const rollPart = message.system.damage[damageType].parts[part];

        let diceIndex = 0;
        let parsedRoll = game.system.api.dice.DamageRoll.fromData({
            ...rollPart.roll,
            terms: rollPart.roll.terms.map(term => {
                const isDie = term.class === 'Die';
                const fixedTerm = {
                    ...term,
                    ...(isDie ? { results: rollPart.dice[diceIndex].results } : {})
                };

                if (isDie) diceIndex++;
                return fixedTerm;
            }),
            class: 'DamageRoll',
            evaluated: false
        });

        const parsedDiceTerms = Object.keys(parsedRoll.terms).reduce((acc, key) => {
            const term = parsedRoll.terms[key];
            if (term instanceof CONFIG.Dice.termTypes.DiceTerm) acc[Object.keys(acc).length] = term;
            return acc;
        }, {});
        const term = parsedDiceTerms[dice];
        const termResult = parsedDiceTerms[dice].results[result];

        const newIndex = parsedDiceTerms[dice].results.length;
        await term.reroll(`/r1=${termResult.result}`);

        if (game.modules.get('dice-so-nice')?.active) {
            const newResult = parsedDiceTerms[dice].results[newIndex];
            const diceSoNiceRoll = {
                _evaluated: true,
                dice: [
                    new foundry.dice.terms.Die({
                        ...term,
                        total: newResult.result,
                        faces: term._faces,
                        results: [newResult]
                    })
                ],
                options: { appearance: {} }
            };

            await game.dice3d.showForRoll(diceSoNiceRoll, game.user, true);
        }

        await parsedRoll.evaluate();

        const results = parsedRoll.dice[dice].results.map(result => ({
            ...result,
            discarded: !result.active
        }));
        const newResult = results.splice(results.length - 1, 1);
        results.splice(Number(result) + 1, 0, newResult[0]);

        const rerolledDice = parsedRoll.dice.map((x, index) => {
            const isRerollDice = index === Number(dice);
            if (!isRerollDice) return { ...x, dice: x.denomination };
            return {
                dice: parsedRoll.dice[dice].denomination,
                total: parsedRoll.dice[dice].total,
                results: results.map(result => ({
                    ...result,
                    hasRerolls: result.hasRerolls || isRerollDice
                }))
            };
        });

        const updateMessage = game.messages.get(message._id);
        await updateMessage.update({
            [`system.damage.${damageType}`]: {
                ...updateMessage,
                total: parsedRoll.total,
                [`parts.${part}`]: {
                    ...rollPart,
                    total: parsedRoll.total,
                    dice: rerolledDice
                }
            }
        });
    }
}
