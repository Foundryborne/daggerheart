import DamageDialog from '../applications/dialogs/damageDialog.mjs';
import { getCritDamageBonus, parseRallyDice, triggerChatRollFx } from '../helpers/utils.mjs';
import DHRoll from './dhRoll.mjs';

export default class DamageRoll extends DHRoll {
    constructor(formula, data = {}, options = {}) {
        super(formula, data, options);
    }

    get isCritical() {
        return this.options.isCritical;
    }

    get modifierTotal() {
        const criticalDamageBonus = this.isCritical ? getCritDamageBonus(this.terms) : 0;
        return super.modifierTotal + criticalDamageBonus;
    }

    get total() {
        const criticalDamageBonus = this.isCritical ? getCritDamageBonus(this.terms) : 0;
        return super.total + criticalDamageBonus;
    }

    static DefaultDialog = DamageDialog;

    static createRollInstance(config) {
        return new this(undefined, config.data, config);
    }

    /** @inheritdoc */
    static async buildEvaluate(roll, config = {}) {
        if (config.dialog.configure === false) roll.constructFormulas(config);
        
        const evaluateRoll = async roll => {
            await roll.roll.evaluate();
            roll.roll.options = { ...roll.roll.options, damageTypes: roll.damageTypes ? [...roll.damageTypes] : [] };
            return roll.roll;
        }

        if (!config.damage) config.damage = { main: null, resources: {} };

        if (config.damageFormula) {
            config.damage.main = await evaluateRoll(config.damageFormula);
            config.damage.main.options = { 
                ...config.damage.main.options,
                damageTypes: 
                    config.damageFormula.damageTypes ? [...config.damageFormula.damageTypes] : []
            };
        }
        
        for (const roll of config.resourceFormulas) {
            config.damage.resources[roll.applyTo] = await evaluateRoll(roll);
        }

        roll._evaluated = true;
    }

    static async buildPost(roll, config, message) {
        const chatMessage = config.source?.message
            ? ui.chat.collection.get(config.source.message)
            : getDocumentClass('ChatMessage').applyMode({}, config.rollMode ?? 'public');

        const diceRolls = [];
        if (game.modules.get('dice-so-nice')?.active) {
            config.mute = true;
            const pool = foundry.dice.terms.PoolTerm.fromRolls([
                ...(config.damage.main ? [config.damage.main] : []),
                ...Object.values(config.damage.resources)
            ]);
            diceRolls.push(Roll.fromTerms([pool]));
        }

        await triggerChatRollFx(diceRolls, {
            whisper: chatMessage.whisper?.length > 0 ? chatMessage.whisper : null,
            blind: chatMessage.blind
        });
        await super.buildPost(roll, config, message);

        if (config.source?.message) {
            chatMessage.update({ 'system.damage': {
                ...config.damage.toObject(),
                main: config.damage.main,
                resources: config.damage.resources
            }});
        }
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

    getActionChangeKeys() {
        const type = this.options.messageType ?? (this.options.hasHealing ? 'healing' : 'damage');
        const changeKeys = [];

        for (const damageType of this.options.damageFormula?.damageTypes?.values?.() ?? []) {
            changeKeys.push(`system.bonuses.${type}.${damageType}`);
        }
        
        const item = this.data.parent?.items?.get(this.options.source.item);
        if (item) {
            switch (item.type) {
                case 'weapon':
                    if (!this.options.hasHealing)
                        ['primaryWeapon', 'secondaryWeapon'].forEach(w =>
                            changeKeys.push(`system.bonuses.damage.${w}`)
                        );
                    break;
            }
        }

        return changeKeys;
    }

    constructFormulas(config) {
        return {
            damageFormula: this.constructFormula(this.options.damageFormula, config, true),
            resourceFormulas: this.options.resourceFormulas.map(x => this.constructFormula(x, config))
        };
    }

    constructFormula(formulaData, config, isDamage) {
        if (!formulaData) return null;
        this.options.isCritical = config.isCritical;

        formulaData.roll = new this.constructor(Roll.replaceFormulaData(formulaData.formula, config.data));
        formulaData.roll.terms = Roll.parse(formulaData.roll.formula, config.data);

        if (formulaData.extraFormula) {
            formulaData.roll.terms.push(
                new foundry.dice.terms.OperatorTerm({ operator: '+' }),
                ...this.constructor.parse(formulaData.extraFormula, this.options.data)
            );
        }

        if (isDamage && formulaData.applyTo === CONFIG.DH.GENERAL.healingTypes.hitPoints.id) {
            formulaData.modifiers = this.applyBaseBonus(formulaData);
            this.addModifiers(formulaData);
            formulaData.modifiers?.forEach(m => {
                formulaData.roll.terms.push(...this.formatModifier(m.value));
            });

            /* To Remove When Reaction System */
            for (const mod in config.modifiers) {
                const modifier = config.modifiers[mod];
                if (
                    modifier.beforeCrit === true && 
                    (modifier.enabled || modifier.value)
                ) modifier.callback(formulaData);
            }

            /* To Remove When Reaction System */
            for (const mod in config.modifiers) {
                const modifier = config.modifiers[mod];
                if (!modifier.beforeCrit && (modifier.enabled || modifier.value)) modifier.callback(formulaData);
            }

            if (config.damageOptions.groupAttack?.numAttackers > 1) {
                const damageTypes = [foundry.dice.terms.Die, foundry.dice.terms.NumericTerm];
                for (const term of formulaData.roll.terms) {
                    if (damageTypes.some(type => term instanceof type)) {
                        term.number *= config.damageOptions.groupAttack.numAttackers;
                    }
                }
            }

            if (config.isCritical) {
                const total = formulaData.roll.dice.reduce((acc, term) => acc + term._faces * term._number, 0);
                if (total > 0) {
                    formulaData.roll.terms.push(...this.formatModifier(total));
                }
            }
        }

        formulaData.roll._formula = this.constructor.getFormula(formulaData.roll.terms);
        
        return formulaData;
    }

    /* To Remove When Reaction System */
    static temporaryModifierBuilder(config) {
        const mods = {};
        if (config.data?.parent) {
            if (config.data.parent.appliedEffects) {
                // Bardic Rally
                const rallyChoices = config.data?.parent?.appliedEffects.reduce((a, c) => {
                    const change = c.system.changes.find(ch => ch.key === 'system.bonuses.rally');
                    if (change) a.push({ value: c.id, label: parseRallyDice(change.value, c) });
                    return a;
                }, []);
                if (rallyChoices.length) {
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
}
