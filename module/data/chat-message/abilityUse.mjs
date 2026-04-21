export default class DHAbilityUse extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            origin: new fields.StringField({}),
            img: new fields.StringField({}),
            name: new fields.StringField({}),
            description: new fields.StringField({}),
            source: new fields.SchemaField({
                actor: new fields.StringField(),
                item: new fields.StringField(),
                action: new fields.StringField()
            })
        };
    }

    get actionActor() {
        if (!this.source.actor) return null;
        return fromUuidSync(this.source.actor);
    }

    get actionItem() {
        const actionActor = this.actionActor;
        if (!actionActor || !this.source.item) return null;

        const item = actionActor.items.get(this.source.item);
        return item ? item.system.actions?.find(a => a.id === this.source.action) : null;
    }

    get action() {
        const { actionItem: itemAction } = this;
        if (!this.source.action) return null;
        if (itemAction) return itemAction;
        return null;
    }
}
