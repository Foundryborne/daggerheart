import BaseEffect from './baseEffect.mjs';

export default class CompanionEffect extends BaseEffect {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            ...BaseEffect.defineSchema()
        };
    }
}
