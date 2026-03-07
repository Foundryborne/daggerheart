const fields = foundry.data.fields;

export default class DHSummonField extends fields.SchemaField {
    /**
     * Action Workflow order
     */
    static order = 130;

    constructor(options = {}, context = {}) {
        const transformFields = {
            actorUUID: new fields.DocumentUUIDField({
                type: 'Actor',
                required: true
            })
        };
        super(transformFields, options, context);
    }

    static async execute() {
        if (!canvas.scene)
            return ui.notifications.warn(game.i18n.localize('DAGGERHEART.ACTIONS.TYPES.transform.canvasError'));

        if (!this.actor.token)
            return ui.notifications.warn(game.i18n.localize('DAGGERHEART.ACTIONS.TYPES.transform.prototypeError'));

        const actor = await DHSummonField.getWorldActor(await foundry.utils.fromUuid(this.transform.actorUUID));

        await this.actor.token.update(
            { ...actor.prototypeToken.toJSON(), actorId: actor.id },
            { diff: false, recursive: false, noHook: true }
        );
        this.actor.sheet.close();
        actor.sheet.render({ force: true });
    }

    /* Check for any available instances of the actor present in the world, or create a world actor based on compendium */
    static async getWorldActor(baseActor) {
        const dataType = game.system.api.data.actors[`Dh${baseActor.type.capitalize()}`];
        if (baseActor.inCompendium && dataType && baseActor.img === dataType.DEFAULT_ICON) {
            const worldActorCopy = game.actors.find(x => x.name === baseActor.name);
            if (worldActorCopy) return worldActorCopy;
        }

        const worldActor = await game.system.api.documents.DhpActor.create(baseActor.toObject());
        return worldActor;
    }
}
