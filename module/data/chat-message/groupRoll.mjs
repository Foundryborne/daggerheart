import { abilities } from '../../config/actorConfig.mjs';

export default class DHGroupRoll extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            leader: new fields.EmbeddedDataField(GroupRollMemberField),
            members: new fields.ArrayField(new fields.EmbeddedDataField(GroupRollMemberField))
        };
    }
}

class GroupRollMemberField extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            actor: new fields.ObjectField(),
            trait: new fields.StringField({ choices: abilities }),
            difficulty: new fields.StringField(),
            result: new fields.ObjectField({ nullable: true, initial: null }),
            manualSuccess: new fields.BooleanField({ nullable: true, initial: null })
        };
    }

    /* Can be expanded if we handle automation of success/failure */
    get success() {
        return manualSuccess;
    }
}
