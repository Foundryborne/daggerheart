import DaggerheartAction from './action.mjs';

export default class DhpDomainCard extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            domain: new fields.StringField(
                { choices: SYSTEM.DOMAIN.domains, integer: false },
                { required: true, initial: [] }
            ),
            level: new fields.NumberField({ initial: 1, integer: true }),
            recallCost: new fields.NumberField({ initial: 0, integer: true }),
            type: new fields.StringField(
                { choices: SYSTEM.DOMAIN.cardTypes, integer: false },
                { required: true, initial: [] }
            ),
            foundation: new fields.BooleanField({ initial: false }),
            effect: new fields.HTMLField({}),
            inVault: new fields.BooleanField({ initial: false }),
            actions: new fields.ArrayField(new fields.EmbeddedDataField(DaggerheartAction))
        };
    }
}
