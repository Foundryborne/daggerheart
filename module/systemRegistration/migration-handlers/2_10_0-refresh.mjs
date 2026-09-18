import { MigrationHandlerBase } from './base.mjs';

export class Migration_2_10_0_Refresh extends MigrationHandlerBase {
    /** @inheritdoc */
    version = '2.10.0';

    async updateItemSource(item) {
        if (item.type !== 'weapon') return null;

        const latest = await fromUuid(item.refreshSourceUuid);
        const featureKey = 'weaponFeatures';
        const features = item.system[featureKey];
        if (!latest || !features?.length) return null;

        let latestEffects = latest.effects.map(e => e.toObject(true));
        let effects = item.effects.map(e => e.toObject(true));
        for (const feature of features) {
            const relatedFeature = latest.system[featureKey]?.find(f => f.value == feature.value);
            if (!relatedFeature) continue;

            for (const [idx, effectId] of feature.effectIds.entries()) {
                const effect = effects.find(e => e._id === effectId);
                const relatedEffect = latestEffects.find(e => e._id === relatedFeature.effectIds?.[idx]);
                if (effect && relatedEffect && effect.name === relatedEffect.name) {
                    effect.system.conditionals = relatedEffect.system.conditionals;
                }
            }
        }

        return { _id: item._id, effects };
    }
}