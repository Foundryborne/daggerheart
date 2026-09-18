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

            const disabledStatuses = effects.filter(e => feature.effectIds?.includes(e._id)).map(e => e.disabled);
            effects = effects.filter(e => !feature.effectIds?.includes(e._id));
            feature.effectIds = [...relatedFeature.effectIds];
            const newEffects = latestEffects.filter(e => relatedFeature.effectIds.includes(e._id));
            for (const [idx, disabled] of disabledStatuses.entries()) {
                if (newEffects[idx]) newEffects[idx].disabled = disabled;
            }
            effects = [...effects, ...newEffects];
        }

        return { _id: item._id, effects };
    }
}