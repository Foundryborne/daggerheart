import BaseDataActor from './base.mjs';

export default class DhCreature extends BaseDataActor {
    /**@inheritdoc */
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            ...super.defineSchema(),
            advantageSources: new fields.ArrayField(new fields.StringField(), {
                label: 'DAGGERHEART.ACTORS.Character.advantageSources.label',
                hint: 'DAGGERHEART.ACTORS.Character.advantageSources.hint'
            }),
            disadvantageSources: new fields.ArrayField(new fields.StringField(), {
                label: 'DAGGERHEART.ACTORS.Character.disadvantageSources.label',
                hint: 'DAGGERHEART.ACTORS.Character.disadvantageSources.hint'
            })
        };
    }
}
