import DHAdversarySettings from '../../applications/sheets-configs/adversary-settings.mjs';
import { ActionField } from '../fields/actionField.mjs';
import BaseDataActor, { commonActorRules } from './base.mjs';
import { resourceField, bonusField } from '../fields/actorField.mjs';
import { parseTermsFromSimpleFormula } from '../../helpers/utils.mjs';
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
        const expectedDamageData = adversaryExpectedDamage[source.system.type] ?? adversaryExpectedDamage.basic;
        const currentDamageRange = { tier: source.system.tier, ...expectedDamageData[source.system.tier] };
        const newDamageRange = { tier, ...expectedDamageData[tier] };

        // Update damage of base attack
        this.#convertDamage(source.system.attack.damage, "attack", currentDamageRange, newDamageRange);

        // Update damage of each item action, making sure to also update the description if possible
        for (const item of source.items) {
            // todo: damage inlines (must be done before other changes so that it doesn't get incorrectly applied)

            for (const action of Object.values(item.system.actions)) {
                if (!action.damage) continue;
                const formula = this.#parseDamage(action.damage).formula;
                this.#convertDamage(action.damage, "action", currentDamageRange, newDamageRange);

                const oldFormulaRegexp = new RegExp(formula.replace('+', '(?:\\s)?\\+(?:\\s)?'));
                const newFormula = this.#parseDamage(action.damage).formula;
                item.system.description = item.system.description.replace(oldFormulaRegexp, newFormula);
                action.description = action.description.replace(oldFormulaRegexp, newFormula);
            }
        }

        // Finally set the tier of the source data, now that everything is complete
        source.system.tier = tier;
        return source;
    }

    #parseDamage(damage) {
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
        const expected = terms.reduce((r, t) => r + (t.modifier ?? 0) + (t.dice ? (t.dice * (t.faces + 1)) / 2 : 0), 0);
        return { formula, terms, expected };
    }

    /** 
     * Converts a damage object to a new damage range
     * @param type whether this is a basic "attack" or a regular "action" 
     */
    #convertDamage(damage, type, currentDamageRange, newDamageRange) {
        const hitPointParts = damage.parts.filter(d => d.applyTo === 'hitPoints');
        if (hitPointParts.length === 0) return; // nothing to do
        const previousExpected = this.#parseDamage(damage).expected;
        if (previousExpected === 0) return; // nothing to do
        // others are not supported yet. Later on we should convert to terms, then convert from terms back to real data
        if (!(hitPointParts.length === 1 && !hitPointParts[0].value.custom.enabled)) return; 

        const dieSizes = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];
        const steps = newDamageRange.tier - currentDamageRange.tier;
        const increasing = steps > 0;
        const deviation = (previousExpected - currentDamageRange.mean) / currentDamageRange.deviation;
        const expected = newDamageRange.mean + newDamageRange.deviation * deviation;

        const value = hitPointParts[0].value;
        const getExpectedDie = () => Number(value.dice.replace('d', '')) / 2;
        const getBaseAverage = () => value.flatMultiplier * getExpectedDie();

        // Check the number of base overages over the expected die. In the end, if the bonus inflates too much, we add a die
        const baseOverages = Math.floor(value.bonus / getExpectedDie());

        // Prestep. Change number of dice for attacks, bump up/down for actions
        // We never bump up to d20, though we might bump down from it
        if (type === "attack") {
            const minimum = increasing ? value.flatMultiplier : 0;
            value.flatMultiplier = Math.max(minimum, newDamageRange.tier);
        } else {
            const currentIdx = dieSizes.indexOf(value.dice);
            value.dice = dieSizes[Math.clamp(currentIdx + steps, 0, 4)]
        }

        value.bonus = Math.round(expected - getBaseAverage());

        // Attempt to handle negative values.
        // If we can do it with only step downs, do so. Otherwise remove tier dice, and try again
        if (value.bonus < 0) {
            let stepsRequired = Math.ceil(Math.abs(value.bonus) / value.flatMultiplier);
            const currentIdx = dieSizes.indexOf(value.dice);

            // If step downs alone don't suffice, change the flat modifier, then calculate steps required again
            // If this isn't sufficient, the result will be slightly off. This is unlikely to happen
            if (type !== "attack" && stepsRequired > currentIdx && value.flatMultiplier > 0) {
                value.flatMultiplier -= increasing ? 1 : Math.abs(steps);
                value.bonus = Math.round(expected - getBaseAverage());
                if (value.bonus >= 0) return; // complete
            }

            stepsRequired = Math.ceil(Math.abs(value.bonus) / value.flatMultiplier);
            value.dice = dieSizes[Math.max(0, currentIdx - stepsRequired)];
            value.bonus = Math.max(0, Math.round(expected - getBaseAverage()));
        }

        // If value is really high, we add a number of dice based on the number of overages
        // This attempts to preserve a similar amount of variance when increasing an action
        const overagesToRemove = Math.floor(value.bonus / getExpectedDie()) - baseOverages;
        if (type !== "attack" && increasing && overagesToRemove > 0) {
            value.flatMultiplier += overagesToRemove;
            value.bonus = Math.round(expected - getBaseAverage());
        }
    }
}
