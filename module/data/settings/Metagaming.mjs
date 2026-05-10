import { resetAndRerenderActors } from '../../helpers/utils.mjs';

export default class DhMetagaming extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            hideObserverPermissionInChat: new fields.BooleanField({
                initial: false,
                label: 'DAGGERHEART.SETTINGS.Metagaming.FIELDS.hideObserverPermissionInChat.label',
                hint: 'DAGGERHEART.SETTINGS.Metagaming.FIELDS.hideObserverPermissionInChat.hint'
            }),
            hidePartyStats: new fields.StringField({
                initial: 'never',
                label: 'DAGGERHEART.SETTINGS.Metagaming.FIELDS.hidePartyStats.label',
                hint: 'DAGGERHEART.SETTINGS.Metagaming.FIELDS.hidePartyStats.hint',
                required: true,
                nullable: false,
                choices: {
                    never: 'DAGGERHEART.SETTINGS.Metagaming.FIELDS.hidePartyStats.choices.never',
                    players: 'DAGGERHEART.SETTINGS.Metagaming.FIELDS.hidePartyStats.choices.players',
                    always: 'DAGGERHEART.SETTINGS.Metagaming.FIELDS.hidePartyStats.choices.always'
                }
            })
        };
    }

    /** Invoked by the setting when data changes */
    handleChange() {
        resetAndRerenderActors();
    }
}
