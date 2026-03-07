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
            }),
            resourceRefresh: new fields.SchemaField({
                hitPoints: new fields.BooleanField({ initial: true }),
                stress: new fields.BooleanField({ initial: true })
            })
        };
        super(transformFields, options, context);
    }

    static async execute() {
        if (!this.transform.actorUUID) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.ACTIONS.TYPES.transform.noTransformActor'));
            return false;
        }

        const baseActor = await foundry.utils.fromUuid(this.transform.actorUUID);
        if (!baseActor) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.ACTIONS.TYPES.transform.transformActorMissing'));
            return false;
        }

        if (!canvas.scene) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.ACTIONS.TYPES.transform.canvasError'));
            return false;
        }

        if (this.actor.prototypeToken.actorLink) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.ACTIONS.TYPES.transform.actorLinkError'));
            return false;
        }

        if (!this.actor.token) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.ACTIONS.TYPES.transform.prototypeError'));
            return false;
        }

        const actor = await DHSummonField.getWorldActor(baseActor);
        const tokenSizes = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).tokenSizes;
        const tokenSize = actor?.system.metadata.usesSize ? tokenSizes[actor.system.size] : actor.prototypeToken.width;

        await this.actor.token.update(
            { ...actor.prototypeToken.toJSON(), actorId: actor.id, width: tokenSize, height: tokenSize },
            { diff: false, recursive: false, noHook: true }
        );

        if (this.actor.token.combatant) {
            this.actor.token.combatant.update({ actorId: actor.id, img: actor.prototypeToken.texture.src });
        }

        const marks = { hitPoints: 0, stress: 0 };
        if (!this.transform.resourceRefresh.hitPoints) {
            marks.hitPoints = Math.min(
                this.actor.system.resources.hitPoints.value,
                this.actor.token.actor.system.resources.hitPoints.max - 1
            );
        }
        if (!this.transform.resourceRefresh.stress) {
            marks.stress = Math.min(
                this.actor.system.resources.stress.value,
                this.actor.token.actor.system.resources.stress.max - 1
            );
        }
        if (marks.hitPoints || marks.stress) {
            this.actor.token.actor.update({
                'system.resources': {
                    hitPoints: { value: marks.hitPoints },
                    stress: { value: marks.stress }
                }
            });
        }

        const prevPosition = { ...this.actor.sheet.position };
        this.actor.sheet.close();
        this.actor.token.actor.sheet.render({ force: true, position: prevPosition });
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
