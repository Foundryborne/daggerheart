import DHAdversarySettings from '../../applications/sheets-configs/adversary-settings.mjs';
import { ActionField } from '../fields/actionField.mjs';
import BaseDataActor, { commonActorRules } from './base.mjs';
import { resourceField, bonusField } from '../fields/actorField.mjs';
import { calculateExpectedValue, parseTermsFromSimpleFormula } from '../../helpers/utils.mjs';
import { adversaryExpectedDamage, adversaryScalingData } from '../../config/actorConfig.mjs';

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
            criticalThreshold: new fields.NumberField({
                required: true,
                integer: true,
                min: 1,
                max: 20,
                initial: 20,
                label: 'DAGGERHEART.ACTIONS.Settings.criticalThreshold'
            }),
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

    /** Returns source data for this actor adjusted to a new tier, which can be used to create a new actor. */
    adjustForTier(tier) {
        const source = this.parent.toObject(true);

        /** @type {(2 | 3 | 4)[]} */
        const tiers = new Array(Math.abs(tier - this.tier))
            .fill(0)
            .map((_, idx) => idx + Math.min(tier, this.tier) + 1);
        if (tier < this.tier) tiers.reverse();
        const typeData = adversaryScalingData[source.system.type] ?? adversaryScalingData[source.system.standard];
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

        // Get the mean and standard deviation of expected damage in the previous and new tier
        // The data we have is for attack scaling, but we reuse this for action scaling later
        const expectedDamageData = adversaryExpectedDamage[source.system.type] ?? adversaryExpectedDamage.basic;
        const damageMeta = {
            currentDamageRange: { tier: source.system.tier, ...expectedDamageData[source.system.tier] },
            newDamageRange: { tier, ...expectedDamageData[tier] },
            type: 'attack'
        };

        // Update damage of base attack
        try {
            this.#adjustActionDamage(source.system.attack, damageMeta);
        } catch (err) {
            ui.notifications.warn('Failed to convert attack damage of adversary');
            console.error(err);
        }

        // Update damage of each item action, making sure to also update the description if possible
        const damageRegex = /@Damage\[([^\[\]]*)\]({[^}]*})?/g;
        for (const item of source.items) {
            // Replace damage inlines with new formulas
            for (const withDescription of [item.system, ...Object.values(item.system.actions)]) {
                withDescription.description = withDescription.description.replace(damageRegex, (match, inner) => {
                    const { value: formula } = parseInlineParams(inner);
                    if (!formula || !type) return match;

                    try {
                        const adjusted = this.#calculateAdjustedDamage(formula, { ...damageMeta, type: 'action' });
                        const newFormula = [
                            adjusted.diceQuantity ? `${adjusted.diceQuantity}d${adjusted.faces}` : null,
                            adjusted.bonus
                        ]
                            .filter(p => !!p)
                            .join('+');
                        return match.replace(formula, newFormula);
                    } catch {
                        return match;
                    }
                });
            }

            // Update damage in item actions
            for (const action of Object.values(item.system.actions)) {
                if (!action.damage) continue;

                // Parse damage, and convert all formula matches in the descriptions to the new damage
                try {
                    const result = this.#adjustActionDamage(action, { ...damageMeta, type: 'action' });
                    for (const { previousFormula, formula } of Object.values(result)) {
                        const oldFormulaRegexp = new RegExp(
                            previousFormula.replace(' ', '').replace('+', '(?:\\s)?\\+(?:\\s)?')
                        );
                        item.system.description = item.system.description.replace(oldFormulaRegexp, formula);
                        action.description = action.description.replace(oldFormulaRegexp, formula);
                    }
                } catch (err) {
                    ui.notifications.warn(`Failed to convert action damage for item ${item.name}`);
                    console.error(err);
                }
            }
        }

        // Finally set the tier of the source data, now that everything is complete
        source.system.tier = tier;
        return source;
    }

    /**
     * Converts a damage object to a new damage range
     * @returns {{ diceQuantity: number; faces: number; bonus: number }} the adjusted result as a combined term
     * @throws error if the formula is the wrong type
     */
    #calculateAdjustedDamage(formula, { currentDamageRange, newDamageRange, type }) {
        const terms = parseTermsFromSimpleFormula(formula);
        const flatTerms = terms.filter(t => t.diceQuantity === 0);
        const diceTerms = terms.filter(t => t.diceQuantity > 0);
        if (flatTerms.length > 1 || diceTerms.length > 1) {
            throw new Error('invalid formula for conversion');
        }
        const value = {
            ...(diceTerms[0] ?? { diceQuantity: 0, faces: 1 }),
            bonus: flatTerms[0]?.bonus ?? 0
        };
        const previousExpected = calculateExpectedValue(value);
        if (previousExpected === 0) return value; // nothing to do

        const dieSizes = [4, 6, 8, 10, 12, 20];
        const steps = newDamageRange.tier - currentDamageRange.tier;
        const increasing = steps > 0;
        const deviation = (previousExpected - currentDamageRange.mean) / currentDamageRange.deviation;
        const expected = Math.max(1, newDamageRange.mean + newDamageRange.deviation * deviation);

        // If this was just a flat number, convert to the expected damage and exit
        if (value.diceQuantity === 0) {
            value.bonus = Math.round(expected);
            return value;
        }

        const getExpectedDie = () => calculateExpectedValue({ diceQuantity: 1, faces: value.faces }) || 1;
        const getBaseAverage = () => calculateExpectedValue({ ...value, bonus: 0 });

        // Check the number of base overages over the expected die. In the end, if the bonus inflates too much, we add a die
        const baseOverages = Math.floor(value.bonus / getExpectedDie());

        // Prestep. Change number of dice for attacks, bump up/down for actions
        // We never bump up to d20, though we might bump down from it
        if (type === 'attack') {
            const minimum = increasing ? value.diceQuantity : 0;
            value.diceQuantity = Math.max(minimum, newDamageRange.tier);
        } else {
            const currentIdx = dieSizes.indexOf(value.faces);
            value.faces = dieSizes[Math.clamp(currentIdx + steps, 0, 4)];
        }

        value.bonus = Math.round(expected - getBaseAverage());

        // Attempt to handle negative values.
        // If we can do it with only step downs, do so. Otherwise remove tier dice, and try again
        if (value.bonus < 0) {
            let stepsRequired = Math.ceil(Math.abs(value.bonus) / value.diceQuantity);
            const currentIdx = dieSizes.indexOf(value.faces);

            // If step downs alone don't suffice, change the flat modifier, then calculate steps required again
            // If this isn't sufficient, the result will be slightly off. This is unlikely to happen
            if (type !== 'attack' && stepsRequired > currentIdx && value.diceQuantity > 0) {
                value.diceQuantity -= increasing ? 1 : Math.abs(steps);
                value.bonus = Math.round(expected - getBaseAverage());
                if (value.bonus >= 0) return value; // complete
            }

            stepsRequired = Math.ceil(Math.abs(value.bonus) / value.diceQuantity);
            value.faces = dieSizes[Math.max(0, currentIdx - stepsRequired)];
            value.bonus = Math.max(0, Math.round(expected - getBaseAverage()));
        }

        // If value is really high, we add a number of dice based on the number of overages
        // This attempts to preserve a similar amount of variance when increasing an action
        const overagesToRemove = Math.floor(value.bonus / getExpectedDie()) - baseOverages;
        if (type !== 'attack' && increasing && overagesToRemove > 0) {
            value.diceQuantity += overagesToRemove;
            value.bonus = Math.round(expected - getBaseAverage());
        }

        return value;
    }

    /**
     * Updates damage to reflect a specific value.
     * @throws if damage structure is invalid for conversion
     * @returns the converted formula and value as a simplified term
     */
    #adjustActionDamage(action, damageMeta) {
        // The current algorithm only returns a value if there is a single damage part
        const hpDamageParts = action.damage.parts.filter(d => d.applyTo === 'hitPoints');
        if (hpDamageParts.length !== 1) throw new Error('incorrect number of hp parts');

        const result = {};
        for (const property of ['value', 'valueAlt']) {
            const data = hpDamageParts[0][property];
            const previousFormula = data.custom.enabled
                ? data.custom.formula
                : [data.flatMultiplier ? `${data.flatMultiplier}${data.dice}` : 0, data.bonus ?? 0]
                      .filter(p => !!p)
                      .join('+');
            const value = this.#calculateAdjustedDamage(previousFormula, damageMeta);
            const formula = [value.diceQuantity ? `${value.diceQuantity}d${value.faces}` : null, value.bonus]
                .filter(p => !!p)
                .join('+');
            if (value.diceQuantity) {
                data.custom.enabled = false;
                data.bonus = value.bonus;
                data.dice = `d${value.faces}`;
                data.flatMultiplier = value.diceQuantity;
            } else if (!value.diceQuantity) {
                data.custom.enabled = true;
                data.custom.formula = formula;
            }

            result[property] = { previousFormula, formula, value };
        }

        return result;
    }
}
