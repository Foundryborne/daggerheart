export default class BeastformEffect extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            isBeastform: new fields.BooleanField({ initial: false })
        };
    }

    async _preDelete() {
        if (this.parent.parent.type === 'character') {
            for (let item of this.parent.parent.items) {
                if (item.type === 'beastform') {
                    await item.delete();
                }
            }
        }
    }
}
