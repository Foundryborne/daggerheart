import DHAdversarySettings from '../../applications/sheets-configs/adversary-settings.mjs';
import { ActionField } from '../fields/actionField.mjs';
import BaseDataActor, { commonActorRules } from './base.mjs';
import { resourceField, bonusField } from '../fields/actorField.mjs';
import { parseTermsFromSimpleFormula } from '../../helpers/utils.mjs';

export default class DhpAdversary extends BaseDataActor {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.ACTORS.Adversary'];

    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Actor.adversary',
            type: 'adversary',
            settingSheet: DHAdversarySettings,
            hasAttribution: true,
            usesSize: true
        });
    }

    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            tier: new fields.NumberField({
                required: true,
                integer: true,
                choices: CONFIG.DH.GENERAL.tiers,
                initial: CONFIG.DH.GENERAL.tiers[1].id
            }),
            type: new fields.StringField({
                required: true,
                choices: CONFIG.DH.ACTOR.allAdversaryTypes,
                initial: CONFIG.DH.ACTOR.adversaryTypes.standard.id
            }),
            motivesAndTactics: new fields.StringField(),
            notes: new fields.HTMLField(),
            difficulty: new fields.NumberField({ required: true, initial: 1, integer: true }),
            hordeHp: new fields.NumberField({
                required: true,
                initial: 1,
                integer: true,
                label: 'DAGGERHEART.GENERAL.hordeHp'
            }),
            criticalThreshold: new fields.NumberField({ required: true, integer: true, min: 1, max: 20, initial: 20 }),
            damageThresholds: new fields.SchemaField({
                major: new fields.NumberField({
                    required: true,
                    initial: 0,
                    integer: true,
                    label: 'DAGGERHEART.GENERAL.DamageThresholds.majorThreshold'
                }),
                severe: new fields.NumberField({
                    required: true,
                    initial: 0,
                    integer: true,
                    label: 'DAGGERHEART.GENERAL.DamageThresholds.severeThreshold'
                })
            }),
            resources: new fields.SchemaField({
                hitPoints: resourceField(0, 0, 'DAGGERHEART.GENERAL.HitPoints.plural', true),
                stress: resourceField(0, 0, 'DAGGERHEART.GENERAL.stress', true)
            }),
            rules: new fields.SchemaField({
                ...commonActorRules()
            }),
            attack: new ActionField({
                initial: {
                    name: 'Attack',
                    img: 'icons/skills/melee/blood-slash-foam-red.webp',
                    _id: foundry.utils.randomID(),
                    systemPath: 'attack',
                    chatDisplay: false,
                    type: 'attack',
                    range: 'melee',
                    target: {
                        type: 'any',
                        amount: 1
                    },
                    roll: {
                        type: 'attack'
                    },
                    damage: {
                        parts: [
                            {
                                type: ['physical'],
                                value: {
                                    multiplier: 'flat'
                                }
                            }
                        ]
                    }
                }
            }),
            experiences: new fields.TypedObjectField(
                new fields.SchemaField({
                    name: new fields.StringField(),
                    value: new fields.NumberField({ required: true, integer: true, initial: 1 }),
                    description: new fields.StringField()
                })
            ),
            bonuses: new fields.SchemaField({
                roll: new fields.SchemaField({
                    attack: bonusField('DAGGERHEART.GENERAL.Roll.attack'),
                    action: bonusField('DAGGERHEART.GENERAL.Roll.action'),
                    reaction: bonusField('DAGGERHEART.GENERAL.Roll.reaction')
                }),
                damage: new fields.SchemaField({
                    physical: bonusField('DAGGERHEART.GENERAL.Damage.physicalDamage'),
                    magical: bonusField('DAGGERHEART.GENERAL.Damage.magicalDamage')
                })
            })
        };
    }

    /* -------------------------------------------- */

    /**@inheritdoc */
    static DEFAULT_ICON = 'systems/daggerheart/assets/icons/documents/actors/dragon-head.svg';

    /* -------------------------------------------- */

    get attackBonus() {
        return this.attack.roll.bonus;
    }

    get features() {
        return this.parent.items.filter(x => x.type === 'feature');
    }

    isItemValid(source) {
        return source.type === 'feature';
    }

    async _preUpdate(changes, options, user) {
        const allowed = await super._preUpdate(changes, options, user);
        if (allowed === false) return false;

        if (this.type === CONFIG.DH.ACTOR.adversaryTypes.horde.id) {
            const autoHordeDamage = game.settings.get(
                CONFIG.DH.id,
                CONFIG.DH.SETTINGS.gameSettings.Automation
            ).hordeDamage;
            if (autoHordeDamage && changes.system?.resources?.hitPoints?.value !== undefined) {
                const hordeActiveEffect = this.parent.effects.find(x => x.type === 'horde');
                if (hordeActiveEffect) {
                    const halfHP = Math.ceil(this.resources.hitPoints.max / 2);
                    const newHitPoints = changes.system.resources.hitPoints.value;
                    const previouslyAboveHalf = this.resources.hitPoints.value < halfHP;
                    const loweredBelowHalf = previouslyAboveHalf && newHitPoints >= halfHP;
                    const raisedAboveHalf = !previouslyAboveHalf && newHitPoints < halfHP;
                    if (loweredBelowHalf) {
                        await hordeActiveEffect.update({ disabled: false });
                    } else if (raisedAboveHalf) {
                        await hordeActiveEffect.update({ disabled: true });
                    }
                }
            }
        }
    }

    _onUpdate(changes, options, userId) {
        super._onUpdate(changes, options, userId);

        if (game.user.id === userId) {
            if (changes.system?.type) {
                const existingHordeEffect = this.parent.effects.find(x => x.type === 'horde');
                if (changes.system.type === CONFIG.DH.ACTOR.adversaryTypes.horde.id) {
                    if (!existingHordeEffect)
                        this.parent.createEmbeddedDocuments('ActiveEffect', [
                            {
                                type: 'horde',
                                name: game.i18n.localize('DAGGERHEART.CONFIG.AdversaryType.horde.label'),
                                img: 'icons/magic/movement/chevrons-down-yellow.webp',
                                disabled: true
                            }
                        ]);
                } else {
                    existingHordeEffect?.delete();
                }
            }
        }
    }

    _getTags() {
        const tags = [
            game.i18n.localize(`DAGGERHEART.GENERAL.Tiers.${this.tier}`),
            `${game.i18n.localize(`DAGGERHEART.CONFIG.AdversaryType.${this.type}.label`)}`,
            `${game.i18n.localize('DAGGERHEART.GENERAL.difficulty')}: ${this.difficulty}`
        ];
        return tags;
    }

    adjustForTier(tier) {
        const source = this.parent.toObject(true);
        console.log('Actors and source', this.parent, source);

        /** @type {(2 | 3 | 4)[]} */
        const tiers = new Array(Math.abs(tier - this.tier))
            .fill(0)
            .map((_, idx) => idx + Math.min(tier, this.tier) + 1);
        if (tier < this.tier) tiers.reverse();
        const typeData = ADVERSARY_DATA[source.system.type] ?? ADVERSARY_DATA[source.system.standard];
        const tierEntries = tiers.map(t => ({ tier: t, ...typeData[t] }));

        // Apply simple tier changes
        const scale = tier > this.tier ? 1 : -1;
        for (const entry of tierEntries) {
            source.system.difficulty += scale * entry.difficulty;
            source.system.damageThresholds.major += scale * entry.majorThreshold;
            source.system.damageThresholds.severe += scale * entry.severeThreshold;
            source.system.resources.hitPoints.max += scale * entry.hp;
            source.system.resources.stress.max += scale * entry.stress;
            source.system.attack.roll.bonus += scale * entry.attack;
        }

        /** Returns the mean and standard deviation of a series of average damages */
        const analyzeDamageRange = range => {
            if (range.length <= 1) throw Error('Unexpected damage range, must have at least two entries');
            const mean = range.reduce((a, b) => a + b, 0) / range.length;
            const deviations = range.map(r => r - mean);
            const standardDeviation = Math.sqrt(deviations.reduce((r, d) => r + d * d, 0) / (range.length - 1));
            return { mean, standardDeviation };
        };

        // Calculate mean and standard deviation of expected damage ranges in each tier. Also create a function to remap damage
        const currentDamageRange = analyzeDamageRange(typeData[source.system.tier].damage);
        const newDamageRange = analyzeDamageRange(typeData[tier].damage);
        const convertDamage = (damage, newMean) => {
            const hitPointParts = damage.parts.filter(d => d.applyTo === 'hitPoints');
            if (hitPointParts.length === 1 && !hitPointParts[0].value.custom.enabled) {
                const value = hitPointParts[0].value;
                value.flatMultiplier = Math.max(0, value.flatMultiplier + tier - source.system.tier);
                const baseAverage = (value.flatMultiplier * (Number(value.dice.replace('d', '')) + 1)) / 2;
                value.bonus = Math.round(newMean - baseAverage);
            } else {
                ui.notifications.error(
                    `Failed to convert item ${item.name}: Other kinds of damage is currently unsupported`
                );
            }
        };

        const parseDamage = damage => {
            const formula = damage.parts
                .filter(p => p.applyTo === 'hitPoints')
                .map(p =>
                    p.value.custom.enabled
                        ? p.value.custom.formula
                        : [p.value.flatMultiplier ? `${p.value.flatMultiplier}${p.value.dice}` : 0, p.value.bonus ?? 0]
                              .filter(p => !!p)
                              .join('+')
                )
                .join('+');
            const terms = parseTermsFromSimpleFormula(formula);
            const mean = terms.reduce((r, t) => r + (t.modifier ?? 0) + (t.dice ? (t.dice * (t.faces + 1)) / 2 : 0), 0);
            return { formula, terms, mean };
        };

        // Update damage of base attack
        const atkAverage = parseDamage(source.system.attack.damage).mean;
        const deviation = (atkAverage - currentDamageRange.mean) / currentDamageRange.standardDeviation;
        const newAtkAverage = newDamageRange.mean + newDamageRange.standardDeviation * deviation;
        const damage = source.system.attack.damage;
        convertDamage(damage, newAtkAverage);

        // Update damage of each item action, making sure to also update the description if possible
        for (const item of source.items) {
            // todo: damage inlines (must be done before other changes so that it doesn't get incorrectly applied)

            for (const action of Object.values(item.system.actions)) {
                const damage = action.damage;
                if (!damage) continue;
                const { formula, mean } = parseDamage(damage);
                if (mean === 0) continue;

                const deviation = (mean - currentDamageRange.mean) / currentDamageRange.standardDeviation;
                const newMean = newDamageRange.mean + newDamageRange.standardDeviation * deviation;
                convertDamage(damage, newMean);

                const oldFormulaRegexp = new RegExp(formula.replace('+', '(?:\\s)?\\+(?:\\s)?'));
                const newFormula = parseDamage(action.damage).formula;
                item.system.description = item.system.description.replace(oldFormulaRegexp, newFormula);
                action.description = action.description.replace(oldFormulaRegexp, newFormula);
            }
        }

        // Finally set the tier of the source data, now that everything is complete
        source.system.tier = tier;
        return source;
    }
}

/**
 * @typedef {Object} TierData
 * @property {number} difficulty
 * @property {number} majorThreshold
 * @property {number} severeThreshold
 * @property {number} hp
 * @property {number} stress
 * @property {number} attack
 * @property {number[]} damage
 */

/** @typedef {Record<2 | 3 | 4, TierData> & Record<1, { damage: number[] }} AdversaryScalingData */

/** @type {Record<string, AdversaryScalingData>} */
export const ADVERSARY_DATA = {
    bruiser: {
        1: {
            damage: [8, 11]
        },
        2: {
            difficulty: 2,
            majorThreshold: 5,
            severeThreshold: 10,
            hp: 1,
            stress: 2,
            attack: 2,
            damage: [12, 16]
        },
        3: {
            difficulty: 2,
            majorThreshold: 7,
            severeThreshold: 15,
            hp: 1,
            stress: 0,
            attack: 2,
            damage: [18, 22]
        },
        4: {
            difficulty: 2,
            majorThreshold: 12,
            severeThreshold: 25,
            hp: 1,
            stress: 0,
            attack: 2,
            damage: [30, 45]
        }
    },
    horde: {
        1: {
            damage: [5, 8]
        },
        2: {
            difficulty: 2,
            majorThreshold: 5,
            severeThreshold: 8,
            hp: 2,
            stress: 0,
            attack: 0,
            damage: [9, 13]
        },
        3: {
            difficulty: 2,
            majorThreshold: 5,
            severeThreshold: 12,
            hp: 0,
            stress: 1,
            attack: 1,
            damage: [14, 19]
        },
        4: {
            difficulty: 2,
            majorThreshold: 10,
            severeThreshold: 15,
            hp: 2,
            stress: 0,
            attack: 0,
            damage: [20, 30]
        }
    },
    leader: {
        1: {
            damage: [6, 9]
        },
        2: {
            difficulty: 2,
            majorThreshold: 6,
            severeThreshold: 10,
            hp: 0,
            stress: 0,
            attack: 1,
            damage: [12, 15]
        },
        3: {
            difficulty: 2,
            majorThreshold: 6,
            severeThreshold: 15,
            hp: 1,
            stress: 0,
            attack: 2,
            damage: [15, 18]
        },
        4: {
            difficulty: 2,
            majorThreshold: 12,
            severeThreshold: 25,
            hp: 1,
            stress: 1,
            attack: 3,
            damage: [25, 35]
        }
    },
    minion: {
        1: {
            damage: [1, 3]
        },
        2: {
            difficulty: 2,
            majorThreshold: 0,
            severeThreshold: 0,
            hp: 0,
            stress: 0,
            attack: 1,
            damage: [2, 4]
        },
        3: {
            difficulty: 2,
            majorThreshold: 0,
            severeThreshold: 0,
            hp: 0,
            stress: 1,
            attack: 1,
            damage: [5, 8]
        },
        4: {
            difficulty: 2,
            majorThreshold: 0,
            severeThreshold: 0,
            hp: 0,
            stress: 0,
            attack: 1,
            damage: [10, 12]
        }
    },
    ranged: {
        1: {
            damage: [6, 9]
        },
        2: {
            difficulty: 2,
            majorThreshold: 3,
            severeThreshold: 6,
            hp: 1,
            stress: 0,
            attack: 1,
            damage: [12, 16]
        },
        3: {
            difficulty: 2,
            majorThreshold: 7,
            severeThreshold: 14,
            hp: 1,
            stress: 1,
            attack: 2,
            damage: [15, 18]
        },
        4: {
            difficulty: 2,
            majorThreshold: 5,
            severeThreshold: 10,
            hp: 1,
            stress: 1,
            attack: 1,
            damage: [25, 35]
        }
    },
    skulk: {
        1: {
            damage: [5, 8]
        },
        2: {
            difficulty: 2,
            majorThreshold: 3,
            severeThreshold: 8,
            hp: 1,
            stress: 1,
            attack: 1,
            damage: [9, 13]
        },
        3: {
            difficulty: 2,
            majorThreshold: 8,
            severeThreshold: 12,
            hp: 1,
            stress: 1,
            attack: 1,
            damage: [14, 18]
        },
        4: {
            difficulty: 2,
            majorThreshold: 8,
            severeThreshold: 10,
            hp: 1,
            stress: 1,
            attack: 1,
            damage: [20, 35]
        }
    },
    solo: {
        1: {
            damage: [8, 11]
        },
        2: {
            difficulty: 2,
            majorThreshold: 5,
            severeThreshold: 10,
            hp: 0,
            stress: 1,
            attack: 2,
            damage: [15, 20]
        },
        3: {
            difficulty: 2,
            majorThreshold: 7,
            severeThreshold: 15,
            hp: 2,
            stress: 1,
            attack: 2,
            damage: [20, 30]
        },
        4: {
            difficulty: 2,
            majorThreshold: 12,
            severeThreshold: 25,
            hp: 0,
            stress: 1,
            attack: 3,
            damage: [30, 45]
        }
    },
    standard: {
        1: {
            damage: [4, 6]
        },
        2: {
            difficulty: 2,
            majorThreshold: 3,
            severeThreshold: 8,
            hp: 0,
            stress: 0,
            attack: 1,
            damage: [8, 12]
        },
        3: {
            difficulty: 2,
            majorThreshold: 7,
            severeThreshold: 15,
            hp: 1,
            stress: 1,
            attack: 1,
            damage: [12, 17]
        },
        4: {
            difficulty: 2,
            majorThreshold: 10,
            severeThreshold: 15,
            hp: 0,
            stress: 1,
            attack: 1,
            damage: [17, 20]
        }
    },
    support: {
        1: {
            damage: [3, 5]
        },
        2: {
            difficulty: 2,
            majorThreshold: 3,
            severeThreshold: 8,
            hp: 1,
            stress: 1,
            attack: 1,
            damage: [5, 12]
        },
        3: {
            difficulty: 2,
            majorThreshold: 7,
            severeThreshold: 12,
            hp: 0,
            stress: 0,
            attack: 1,
            damage: [13, 16]
        },
        4: {
            difficulty: 2,
            majorThreshold: 8,
            severeThreshold: 10,
            hp: 1,
            stress: 1,
            attack: 1,
            damage: [18, 25]
        }
    }
};
