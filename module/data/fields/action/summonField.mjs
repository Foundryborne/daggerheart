const fields = foundry.data.fields;

export default class DHSummonField extends fields.ArrayField {
    /**
     * Action Workflow order
     */
    static order = 120;

    constructor(options = {}, context = {}) {
        const summonFields = new fields.SchemaField({
            actorUUID: new fields.DocumentUUIDField({
                type: 'Actor',
                required: true
            }),
            count: new fields.NumberField({
                required: true,
                default: 1,
                min: 1,
                integer: true
            })
        });
        super(summonFields, options, context);
    }

    static async execute() {
        if (!canvas.scene) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.ACTIONS.TYPES.summon.error'));
            return;
        }

        if (this.summon.length === 0) {
            ui.notifications.warn('No actors configured for this Summon action.');
            return;
        }

        const summonData = [];
        for (const summon of this.summon) {
            /* Possibly check for any available instances in the world with prepared images */
            let actor = await foundry.utils.fromUuid(summon.actorUUID);

            /* Check for any available instances of the actor present in the world if we're missing artwork in the compendium */
            const dataType = game.system.api.data.actors[`Dh${actor.type.capitalize()}`];
            if (actor.inCompendium && dataType && actor.img === dataType.DEFAULT_ICON) {
                const worldActorCopy = game.actors.find(x => x.name === actor.name);
                actor = worldActorCopy ?? actor;
            }

            summonData.push({ actor, count: summon.count });
        }

        const handleSummon = async summonIndex => {
            const summon = summonData[summonIndex];
            const result = await CONFIG.ux.TokenManager.createPreviewAsync(summon.actor, {
                name: `${summon.actor.prototypeToken.name}${summon.count > 1 ? ` (${summon.count}x)` : ''}`
            });
            if (!result) return;

            summon.count--;
            if (summon.count === 0) {
                summonIndex++;
                if (summonIndex === summonData.length) return;
            }

            handleSummon(summonIndex);
        };

        handleSummon(0);
    }
}
