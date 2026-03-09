export default class DhMetagaming extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            hideObserverPermissionInChat: new fields.BooleanField({
                initial: false,
                label: 'DAGGERHEART.SETTINGS.Metagaming.FIELDS.hideObserverPermissionInChat.label',
                hint: 'DAGGERHEART.SETTINGS.Metagaming.FIELDS.hideObserverPermissionInChat.hint'
            })
        };
    }
}
