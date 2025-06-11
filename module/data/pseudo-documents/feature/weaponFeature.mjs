import BaseFeatureData from './baseFeatureData.mjs';

export default class WeaponFeature extends BaseFeatureData {
    /**@override */
    static TYPE = 'weapon';

    /**@inheritdoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {}, { inplace: false });
    }
}
