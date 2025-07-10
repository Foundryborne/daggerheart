import DHAdversaryRoll from './adversaryRoll.mjs';

export default class DHDualityRoll extends DHAdversaryRoll {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            ...super.defineSchema(),
            result: new fields.SchemaField({
                duality: new fields.NumberField({ integer: true }),
                label: new fields.StringField(),
                total: new fields.NumberField({ integer: true })
            })
        };
    }

    get messageTemplate() {
        return 'systems/daggerheart/templates/ui/chat/duality-roll.hbs';
    }
}
