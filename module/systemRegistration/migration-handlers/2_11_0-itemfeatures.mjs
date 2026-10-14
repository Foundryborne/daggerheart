import { MigrationHandlerBase } from './base.mjs';

/** 
 * This makes it so that the weaponFeatures/armorFeatures -> itemFeatures migration sticks.
 * Foundry migrations are client side, so attempting to remove keys from newly migrated fields causes issues.
 * This triggers an update so that the actual data can be committed.
 * https://github.com/foundryvtt/foundryvtt/issues/14848
 */
export class Migration_2_11_0_ItemFeatures extends MigrationHandlerBase {
    /** @inheritdoc */
    version = '2.11.0';

    updateItemSource(source) {
        if (['weapon', 'armor'].includes(source.type) && source.system) {
            return {
                _id: source._id,
                system: _replace(source.system)
            };
        }

        return null;
    }
}