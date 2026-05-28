import { calculateExpectedValue, parseTermsFromSimpleFormula } from '../../helpers/utils.mjs';
import { adversaryExpectedDamage, adversaryScalingData } from '../../config/actorConfig.mjs';

export function getTierAdjustedAdversary(source, tier) {
    const currentTier = source.tier ?? 1;

    /** @type {(2 | 3 | 4)[]} */
    const tiers = new Array(Math.abs(tier - currentTier))
        .fill(0)
        .map((_, idx) => idx + Math.min(tier, currentTier) + 1);
    if (tier < currentTier) tiers.reverse();
    const typeData = adversaryScalingData[source.system.type] ?? adversaryScalingData[source.system.standard];
    const tierEntries = tiers.map(t => ({ tier: t, ...typeData[t] }));

    // Apply simple tier changes
    const scale = tier > currentTier ? 1 : -1;
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
        newDamageRange: { tier, ...expectedDamageData[tier] }
    };

    // Store initial attack damage for abilities that have you deal a "standard attack"
    const initialAttack = {
        type: source.system.attack.damage?.parts.hitPoints?.type?.toSorted(),
        value: getDamagePartsFormula(source.system.attack.damage?.parts.hitPoints?.value)
    };

    // Update damage of base attack.
    try {
        const damage = source.system.attack.damage;
        if (!damage?.parts.hitPoints) throw new Error('Unexpected missing attack in adversary');

        for (const property of ['value', 'valueAlt']) {
            const data = damage.parts.hitPoints[property];
            const previousFormula = getDamagePartsFormula(data);
            const { value, formula } = calculateAdjustedDamage(previousFormula, 'attack', damageMeta);
            applyAdjustedDamage(data, value, formula);
        }
    } catch (err) {
        ui.notifications.warn('Failed to convert attack damage of adversary');
        console.error(err);
    }

    // Update damage of each item action, making sure to also update the description if possible
    const damageRegex = /@Damage\[([^\[\]]*)\]({[^}]*})?/g;
    for (const item of source.items) {
        // Replace damage inlines with new formulas. Keep a record for a specific check later
        const descriptionFormulas = [];
        for (const withDescription of [item.system, ...Object.values(item.system.actions)]) {
            withDescription.description = withDescription.description.replace(damageRegex, (match, inner) => {
                const { value: formula } = parseInlineParams(inner);
                if (!formula || !type) return match;

                try {
                    const newFormula = calculateAdjustedDamage(formula, 'action', damageMeta)?.formula;
                    descriptionFormulas.push(formula);
                    return match.replace(formula, newFormula);
                } catch {
                    return match;
                }
            });
        }

        // Update damage in item actions and convert all formula matches in the descriptions to the new damage
        for (const action of Object.values(item.system.actions)) {
            if (!action.damage?.parts.hitPoints) continue;
            try {
                // Apply conversions and save a record. If it matches attack damage *and* Its not in the description, use attack conversion instead
                const result = [];
                for (const property of ['value', 'valueAlt']) {
                    const { [property]: data, type: damageType } = action.damage.parts.hitPoints;
                    const previousFormula = getDamagePartsFormula(data);
                    const isActuallyAttack =
                        previousFormula === initialAttack.value &&
                        foundry.utils.equals(damageType.toSorted(), initialAttack.type) &&
                        !descriptionFormulas.includes(previousFormula);
                    const type = isActuallyAttack ? 'attack' : 'action';
                    const { value, formula } = calculateAdjustedDamage(previousFormula, type, damageMeta);
                    applyAdjustedDamage(data, value, formula);
                    result.push({ previousFormula, formula });
                }

                // Override text in the description with those values
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
function calculateAdjustedDamage(formula, type, { currentDamageRange, newDamageRange }) {
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

    const newFormula = [value.diceQuantity ? `${value.diceQuantity}d${value.faces}` : null, value.bonus]
        .filter(p => !!p)
        .join('+');
    return { value, formula: newFormula };
}

function getDamagePartsFormula(data) {
    return data.custom.enabled
        ? data.custom.formula
        : [data.flatMultiplier ? `${data.flatMultiplier}${data.dice}` : 0, data.bonus ?? 0].filter(p => !!p).join('+');
}

/**
 * Updates damage to reflect a specific value.
 * @throws if damage structure is invalid for conversion
 * @returns the converted formula and value as a simplified term, or null if it doesn't deal HP damage
 */
function applyAdjustedDamage(diceData, value, formula) {
    if (value.diceQuantity) {
        diceData.custom.enabled = false;
        diceData.bonus = value.bonus;
        diceData.dice = `d${value.faces}`;
        diceData.flatMultiplier = value.diceQuantity;
    } else if (!value.diceQuantity) {
        diceData.custom.enabled = true;
        diceData.custom.formula = formula;
    }
}
