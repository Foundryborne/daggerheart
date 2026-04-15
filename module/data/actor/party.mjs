import BaseDataActor from './base.mjs';
import ForeignDocumentUUIDArrayField from '../fields/foreignDocumentUUIDArrayField.mjs';
import TagTeamData from '../tagTeamData.mjs';
import GroupRollData from '../groupRollData.mjs';
import { GoldField } from '../fields/actorField.mjs';

export default class DhParty extends BaseDataActor {
    /**@inheritdoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            partyMembers: new ForeignDocumentUUIDArrayField({ type: 'Actor' }, { prune: true }),
            notes: new fields.HTMLField(),
            gold: new GoldField(),
            tagTeam: new fields.EmbeddedDataField(TagTeamData),
            groupRoll: new fields.EmbeddedDataField(GroupRollData)
        };
    }

    /* -------------------------------------------- */

    /**@inheritdoc */
    static DEFAULT_ICON = 'systems/daggerheart/assets/icons/documents/actors/dark-squad.svg';

    /* -------------------------------------------- */

    isItemValid(source) {
        return ['weapon', 'armor', 'consumable', 'loot'].includes(source.type);
    }

    prepareBaseData() {
        super.prepareBaseData();

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
            member?.parties?.delete(this.parent);
        }
    }
}
