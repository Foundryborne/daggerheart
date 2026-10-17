import { MigrationHandlerBase } from './base.mjs';

/** 
 * This makes it so that the weaponFeatures/armorFeatures -> itemFeatures migration sticks.
 * Foundry migrations are client side, so attempting to remove keys from newly migrated fields causes issues.
 * This triggers an update so that the actual data can be committed.
 * https://github.com/foundryvtt/foundryvtt/issues/14848
 */
export class Migration_2_10_14_ItemFeatures extends MigrationHandlerBase {
    /** @inheritdoc */
    version = '2.10.14';

    migrateCompendiums = true;

    /** @inheritdoc */
    updateItemSource(item) {
        if (!['weapon', 'armor'].includes(item.type) || !item.system) return null;
        
        return {
            _id: item._id,
            system: _replace(item.toObject().system)
        };
    }
}