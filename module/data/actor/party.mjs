import BaseDataActor from './base.mjs';
import ForeignDocumentUUIDArrayField from '../fields/foreignDocumentUUIDArrayField.mjs';
import TagTeamData from '../tagTeamData.mjs';
import GroupRollData from '../groupRollData.mjs';
import { GoldField } from '../fields/actorField.mjs';

export default class DhParty extends BaseDataActor {
    /** @inheritdoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            hasInventory: true,
            quantifiable: ['weapon', 'armor', 'loot', 'consumable']
        });
    }

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

    get active() {
        return game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.ActiveParty) === this.parent.id;
    }

    /* -------------------------------------------- */

    /**@inheritdoc */
    static DEFAULT_ICON = 'systems/daggerheart/assets/icons/documents/actors/dark-squad.svg';

    /* -------------------------------------------- */

    prepareBaseData() {
        super.prepareBaseData();

        // Register this party to all members
        if (game.actors.get(this.parent.id) === this.parent) {
            for (const member of this.partyMembers) {
                member.parties?.add(this.parent);
            }
        }
    }

    _onCreate(data, options, userId) {
        super._onCreate(data, options, userId);

        if (game.user.isActiveGM && !game.actors.party) {
            game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.ActiveParty, this.parent.id).then(_ => {
                ui.actors.render();
            });
        }
    }

    _onDelete(options, userId) {
        super._onDelete(options, userId);

        // Clear this party from all members that aren't deleted
        for (const member of this.partyMembers) {
            member?.parties?.delete(this.parent);
        }

        // If this *was* the active party, delete it. We can't use game.actors.party as this actor was already deleted
        const isWorldActor = !this.parent?.parent && !this.parent.compendium;
        const activePartyId = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.ActiveParty);
        if (isWorldActor && this.id === activePartyId)
            game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.ActiveParty, null);
    }
}
