import BaseDataActor from './base.mjs';
import ForeignDocumentUUIDArrayField from '../fields/foreignDocumentUUIDArrayField.mjs';

export default class DhParty extends BaseDataActor {
    /**@inheritdoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            partyMembers: new ForeignDocumentUUIDArrayField({ type: 'Actor' }, { prune: true }),
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

    isItemValid(source) {
        return ["weapon", "armor", "consumable", "loot"].includes(source.type);
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

    async _preDelete() {
        /* Clear all partyMembers from tagTeam setting.*/
        /* Revisit this when tagTeam is improved for many parties */
        const tagTeam = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.TagTeamRoll);
        await tagTeam.updateSource({
            initiator: this.partyMembers.some(x => x.id === tagTeam.initiator) ? null : tagTeam.initiator,
            members: Object.keys(tagTeam.members).reduce((acc, key) => {
                if (this.partyMembers.find(x => x.id === key)) {
                    acc[`-=${key}`] = null;
                }

                return acc;
            }, {})
        });
        await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.TagTeamRoll, tagTeam);
    }

    _onDelete(options, userId) {
        super._onDelete(options, userId);

        // Clear this party from all members that aren't deleted
        for (const member of this.partyMembers) {
            member?.parties?.delete(this.parent);
        }
    }
}
