import { MigrationHandlerBase } from './base.mjs';

export class Migration_2_5_2 extends MigrationHandlerBase {
    version = '2.5.2';

    /** @inheritdoc */
    async updateActiveEffectSource(effectSource, item) {
        let shouldUpdate = false;
        const newChanges = [];
        const srdItem = item?._stats.compendiumSource ? 
            await foundry.utils.fromUuid(item?._stats.compendiumSource) : 
            null;
        for (let i = 0; i < effectSource.system.changes.length; i++) {
            const change = effectSource.system.changes[i];
            const srdEffect = srdItem?.effects.find(x => x.name === effectSource.name);
            if (change.type === 'custom') {
                const srdChange = srdEffect ? srdEffect.system.changes[i] : null;
                if (
                    change.key === srdChange.key && 
                    change.value === srdChange.value && 
                    change.type !== srdChange.type
                ) {
                    shouldUpdate = true;
                    newChanges.push(srdChange);
                }
            } else {
                newChanges.push(change);
            }
        }

        if (shouldUpdate) {
            return {
                _id: effectSource._id,
                system: { changes: newChanges }
            }
        }
    }
}