import BaseDataActor from './base.mjs';
import ForeignDocumentUUIDArrayField from '../fields/foreignDocumentUUIDArrayField.mjs';

export default class DhParty extends BaseDataActor {
    /**@inheritdoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            partyMembers: new ForeignDocumentUUIDArrayField({ type: 'Actor' }),
            notes: new fields.HTMLField(),
            gold: new fields.SchemaField({
                coins: new fields.NumberField({ initial: 0, integer: true }),
                handfuls: new fields.NumberField({ initial: 1, integer: true }),
                bags: new fields.NumberField({ initial: 0, integer: true }),
                chests: new fields.NumberField({ initial: 0, integer: true })
            })
        };
    }

    /* -------------------------------------------- */

    /**@inheritdoc */
    static DEFAULT_ICON = 'systems/daggerheart/assets/icons/documents/actors/dark-squad.svg';

    /* -------------------------------------------- */
}
