import { ChatDamageData } from './chat-message/chatDamageData.mjs';

export default class TagTeamData extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            initiator: new fields.SchemaField(
                {
                    memberId: new fields.StringField({
                        required: true,
                        label: 'DAGGERHEART.APPLICATIONS.TagTeamSelect.FIELDS.initiator.memberId.label'
                    }),
                    cost: new fields.NumberField({
                        integer: true,
                        initial: 3,
                        label: 'DAGGERHEART.APPLICATIONS.TagTeamSelect.FIELDS.initiator.cost.label'
                    })
                },
                { nullable: true, initial: null }
            ),
            members: new fields.TypedObjectField(new fields.EmbeddedDataField(MemberData))
        };
    }
}

export class MemberData extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            name: new fields.StringField({ required: true }),
            img: new fields.StringField({ required: true }),
            rollType: new fields.StringField({
                required: true,
                choices: CONFIG.DH.GENERAL.tagTeamRollTypes,
                initial: CONFIG.DH.GENERAL.tagTeamRollTypes.trait.id,
                label: game.i18n.localize('DAGGERHEART.APPLICATIONS.TagTeamSelect.rollType')
            }),
            rollChoice: new fields.StringField({ nullable: true, initial: null }),
            rollData: new fields.JSONField({ nullable: true, initial: null }),
            damageRollData: new fields.EmbeddedDataField(ChatDamageData),
            selected: new fields.BooleanField({ initial: false }),
            itemUuid: new fields.StringField(),
            actionUuid: new fields.StringField(),
            costs: new fields.ArrayField(
                new fields.SchemaField({
                    enabled: new fields.BooleanField(),
                    extKey: new fields.StringField(),
                    key: new fields.StringField(),
                    value: new fields.NumberField(),
                    total: new fields.NumberField(),
                    scale: new fields.NumberField(),
                    max: new fields.NumberField()
                })
            ),
            uses: new fields.SchemaField({
                consumeOnSuccess: new fields.BooleanField(),
                enabled: new fields.BooleanField(),
                max: new fields.StringField(),
                recovery: new fields.StringField(),
                remaining: new fields.NumberField(),
                value: new fields.NumberField()
            }, { nullable: true, initial: null })
        };
    }

    get roll() {
        return this.rollData ? CONFIG.Dice.daggerheart.DualityRoll.fromData(this.rollData) : null;
    }
}
