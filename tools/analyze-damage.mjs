/**
 * Internal script to analyze damage and spit out results.
 * There isn't enough entries in the database to make a full analysis, some tiers miss some types.
 * This script only checks for "minions" and "everything else".
 * Maybe if future book monsters can be part of what we release, we can analyze those too.
 */

import fs from "fs/promises";
import path from "path";

const allData = [];

// Read adversary pack data for average damage for attacks
const adversariesDirectory = path.join("src/packs/adversaries");
for (const basefile of await fs.readdir(adversariesDirectory)) {
    if (!basefile.endsWith(".json")) continue;
    const filepath = path.join(adversariesDirectory, basefile);
    const data = JSON.parse(await fs.readFile(filepath, "utf8"));
    if (data?.type !== "adversary" || data.system.type === "social") continue;

    allData.push({
        name: data.name,
        tier: data.system.tier,
        adversaryType: data.system.type,
        damage: parseDamage(data.system.attack.damage),
    });
}

const adversaryTypes = new Set(allData.map(a => a.adversaryType));
for (const type of [...adversaryTypes].toSorted()) {
    const perTier = Object.groupBy(allData.filter(a => a.adversaryType === type), a => a.tier);
    console.log(`${type} per Tier: ${[1, 2, 3, 4].map(t => perTier[t]?.length ?? 0).join(" ")}`)
}

const result = {
    basic: compileData(allData.filter(d => d.adversaryType !== "minion")),
    solos_and_bruisers: compileData(allData.filter(d => ["solo", "bruiser"].includes(d.adversaryType))),
    leader_and_ranged: compileData(allData.filter(d => ["leader", "ranged"].includes(d.adversaryType))),
    minion: compileData(allData.filter(d => d.adversaryType === "minion")),
};

console.log(result);

/** Compiles all data for an adversary type (or all entries) */
function compileData(entries) {
    // Note: sorting numbers sorts by their string version by default
    const results = {};
    for (const tier of [1, 2, 3, 4]) {
        const tierEntries = entries.filter(e => e.tier === tier);
        const allDamage = removeOutliers(tierEntries.map(d => d.damage).sort((a, b) => a - b));
        const mean = getMean(allDamage);
        if (tier === 4) console.log(allDamage);
        results[tier] = {
            mean,
            deviation: getStandardDeviation(allDamage, { mean }),
        };
    }

    return results;
}

function removeOutliers(data) {
    if (data.length <= 4) return data;
    const startIdx = Math.floor(data.length * 0.25);
    const endIdx = Math.ceil(data.length * 0.75);
    const iqrBound = (data[endIdx] - data[startIdx]) * 1.25;
    return data.filter((d) => d >= data[startIdx] - iqrBound && d <= data[endIdx] + iqrBound);
}

function getMedian(numbers) {
    numbers = numbers.toSorted((a, b) => a - b);
    const medianIdx = numbers.length / 2;
    return medianIdx % 1 ? numbers[Math.floor(medianIdx)] : (numbers[medianIdx] + numbers[medianIdx - 1]) / 2;
}

function getMean(numbers) {
    if (numbers.length === 0) return NaN;
    return numbers.reduce((r, a) => r + a, 0) / numbers.length;
}

function getMedianAverageDeviation(numbers, { median }) {
    const residuals = allDamage.map(d => Math.abs(d - median));
    return getMedian(residuals);
}

function getStandardDeviation(numbers, { mean }) {
    const deviations = numbers.map((r) => r - mean);
    return Math.sqrt(deviations.reduce((r, d) => r + d * d, 0) / (numbers.length - 1));
}

function parseDamage(damage) {
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
    return getExpectedDamage(formula);
}

/**
 * Given a simple flavor-less formula with only +/- operators, returns a list of damage partial terms.
 * All subtracted terms become negative terms.
 */
function getExpectedDamage(formula) {
    const terms = formula.replace("+", " + ").replace("-", " - ").split(" ").map(t => t.trim());
    let multiplier = 1;
    return terms.reduce((total, term) => {
        if (term === "-") {
            multiplier = -1;
            return total;
        } else if (term === "+") {
            return total;
        }

        const currentMultiplier = multiplier;
        multiplier = 1;
        
        const number = Number(term);
        if (!Number.isNaN(number)) {
            return total + currentMultiplier * number;
        }

        const dieMatch = term.match(/(\d+)d(\d+)/);
        if (dieMatch) {
            const numDice = Number(dieMatch[1]);
            const faces = Number(dieMatch[2]);
            return total + currentMultiplier * numDice * ((faces + 1) / 2);
        }

        throw Error(`Unexpected term ${term} in formula ${formula}`);
    }, 0);
}
