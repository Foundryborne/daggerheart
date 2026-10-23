
export default function damageReductionMigration(source) {
    source.conditionals ??= [];
    source.changes ??= [];

    const typeRegex = /system\.rules\.damageReduction\.reduceSeverity\.(physical|magical)/;
    const reductionTypes = new Set(source.changes?.map(c => c.key?.match(typeRegex)?.[1]).filter(Boolean));
    // If only one of the physical/magical reductions are there, add a conditional    
    if (reductionTypes.size === 1) {
        source.conditionals.push({ 
            type: CONFIG.DH.EFFECTS.conditionalTypes.damageType.id,
            damageType: reductionTypes.first(),
            role: 'target'
        });
    }
    // Convert keys and then remove duplicates
    // We assume that any attempt to reduce severity are all equal, and don't check other properties
    if (reductionTypes.size) {
        let alreadyChanged = false;
        const removeIndexes = [];
        for (const [idx, change] of source.changes.entries()) {
            const newKey = change.key?.replace(typeRegex, 'system.rules.damageReduction.reduceSeverity');
            if (!newKey || newKey === change.key) continue;

            change.key = newKey;
            if (alreadyChanged) {
                removeIndexes.push(idx);
            }
            alreadyChanged = true;
        }

        if (removeIndexes.length) {
            source.changes = source.changes.filter((_, index) => !removeIndexes.includes(index));
        }
    }
}