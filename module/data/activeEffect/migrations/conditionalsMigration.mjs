const weaponKeys = ['primaryWeapon', 'secondaryWeapon'];

export default function conditionalsMigration(source) {
    if (!source.conditionals) {
        source.conditionals = [];

        const damageTypes = new Set();
        const weaponTypes = new Set();
        const actionTypes = new Set();

        /* Damage Bonus: Gather conditional data and replace outdated changes  */
        const damageTypeIndexes = source.changes.reduce((acc, change, index) => {
            if (change.key.startsWith('system.bonuses.damage.'))
                acc.push(index);

            return acc;
        }, []);

        const newDamageData = damageTypeIndexes.length ? 
            { ...source.changes[damageTypeIndexes[0]], key: 'system.bonuses.damage' } : null;
        for (const index of damageTypeIndexes) {
            const change = source.changes[index];
            const match = change.key.match(/system\.bonuses\.damage\.(.*)\./);
            if (!match?.length) continue;

            const rollDamageType = match[1];
            if (CONFIG.DH.GENERAL.damageTypes[rollDamageType]) {
                damageTypes.add(rollDamageType);
            } else if (weaponKeys.includes(rollDamageType)) {
                weaponTypes.add(rollDamageType);
            }
        }
        for (let i = damageTypeIndexes.length - 1; i >= 0; i--) {
            source.changes.splice(damageTypeIndexes[i], 1);
        }

        /* Roll Bonus: Gather conditional data and replace outdated changes  */
        const rollChangeIndexes = source.changes.reduce((acc, change, index) => {
            if (change.key.startsWith('system.bonuses.roll.'))
                acc.push(index);

            return acc;
        }, []);
        
        const newRollData = rollChangeIndexes.length ? 
            { ...source.changes[rollChangeIndexes[0]], key: 'system.bonuses.roll' } : null;
        for (const index of rollChangeIndexes) {
            const change = source.changes[index];
            const match = change.key.match(/system\.bonuses\.roll\.(.*)\./);
            if (!match?.length) continue;

            const rollBonusType = match[1];
            if (CONFIG.DH.EFFECTS.actionType[rollBonusType]) {
                actionTypes.add(rollBonusType);
            } else if (weaponKeys.includes(rollBonusType)) {
                weaponTypes.add(rollBonusType);
            }
        }
        for (let i = rollChangeIndexes.length - 1; i >= 0; i--) {
            source.changes.splice(rollChangeIndexes[i], 1);
        }

        /* Add the new replacement changes */
        if (newDamageData) source.changes.push(newDamageData);
        if (newRollData) source.changes.push(newRollData);

        /* Add the conditionals */
        if (damageTypes.size === 1) {
            source.conditionals.push({
                type: CONFIG.DH.EFFECTS.conditionalTypes.damageType.id,
                damageType: damageTypes.first()
            });
        }

        if (weaponTypes.size) {
            const { primary, secondary, anyWeapon } = CONFIG.DH.EFFECTS.weaponRestrictionType
            const weaponType = 
                weaponTypes.size > 1 ? anyWeapon.id : 
                    (weaponTypes.first() === 'primaryWeapon' ? primary.id : secondary.id); 
            source.conditionals.push({
                type: CONFIG.DH.EFFECTS.conditionalTypes.weaponRestriction.id,
                weaponType: weaponType
            });
        }

        if (actionTypes.size) {
            source.conditionals.push({
                type: CONFIG.DH.EFFECTS.conditionalTypes.actionType.id,
                actionTypes: [...actionTypes]
            });
        }
    }
}