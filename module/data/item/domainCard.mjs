import DaggerheartAction from "../action.mjs";
import BaseDataItem from "./base.mjs";

export default class DHDomainCard extends BaseDataItem {
    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: "TYPES.Item.domainCard",
            type: "domainCard",
            hasDescription: true,
        });
    }

    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            domain: new fields.StringField({ choices: SYSTEM.DOMAIN.domains, required: true, blank: true }),
            level: new fields.NumberField({ initial: 1, integer: true }),
            recallCost: new fields.NumberField({ initial: 0, integer: true }),
            type: new fields.StringField({ choices: SYSTEM.DOMAIN.cardTypes, required: true, blank: true}),
            foundation: new fields.BooleanField({ initial: false }),
            inVault: new fields.BooleanField({ initial: false }),
            actions: new fields.ArrayField(new fields.EmbeddedDataField(DaggerheartAction))
        };
    }
}
