import { MigrationHandlerBase } from './base.mjs';

/** 
 * Updates protective entries with hardcoded effects to use the new effect config
 */
export class Migration_2_10_14_Protective extends MigrationHandlerBase {
    /** @inheritdoc */
    version = '2.10.14';

    migrateCompendiums = true;

    protectiveName = _loc('DAGGERHEART.CONFIG.WeaponFeature.protective.effects.protective.name');

    descriptionRegex = new RegExp(String.raw`(^|<p>)<strong>(Protective|${this.protectiveName}):?<\/strong>:?([^<\/p>]*)(<\/p>|$)`);

    updateItemSource(item) {
        if (item.type !== 'weapon' || !item.system) return null;

        // Get the protective effect. The matching is looser if it has the protective feature
        // This attempts to potentially grab items like the Labrys Axe
        const source = item.toObject();
        const protectiveData = source.system.itemFeatures?.protective;
        const effects = foundry.utils.deepClone(source.effects) ?? [];
        const protectiveEffect = protectiveData && effects.length === 1
            ? effects[0] : 
            effects.find(e => e.name === 'Protective' || e.name === this.protectiveName);
        const armorChange = protectiveEffect?.system?.changes?.find(c => c.type === 'armor');
        
        // If there was no protective effect with an armor change, there's nothing we can do
        if (!armorChange?.value?.max || armorChange.value.max.includes('@item.itemFeatures.protective')) {
            return null;
        }
        
        protectiveEffect.description = _loc('DAGGERHEART.CONFIG.WeaponFeature.protective.effects.protective.description');
        const protectiveValue = armorChange.value.max.replace(/^ITEM\.@system\./, '@item.');
        armorChange.value.max = `@item.itemFeatures.protective.config.value`;

        return {
            _id: item._id,
            system: {
                description: protectiveData
                    ? source.system.description
                    : source.system.description.replace(this.descriptionRegex, ''),
                itemFeatures: {
                    protective: {
                        value: 'protective',
                        actionIds: [],
                        effectIds: [protectiveEffect._id],
                        ...(protectiveData ?? {}),
                        config: {
                            value: protectiveValue
                        }
                    }
                }
            },
            effects
        }
    }
}