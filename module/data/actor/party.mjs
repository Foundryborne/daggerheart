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

    prepareBaseData() {
        super.prepareBaseData();
        this.partyMembers = this.partyMembers.filter(p => !!p);

        // Register this party to all members
        if (game.actors.get(this.parent.id) === this.parent) {
            for (const member of this.partyMembers) {
                member.parties?.add(this.parent);
            }
        }
    }

    _onDelete(options, userId) {
        super._onDelete(options, userId);

        // Clear this party from all members that aren't deleted
        for (const member of this.partyMembers) {
            member.parties?.delete(this.parent);
        }
    }
}
