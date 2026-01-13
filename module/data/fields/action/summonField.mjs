import FormulaField from '../formulaField.mjs';

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
            count: new FormulaField({
                required: true,
                default: '1'
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

        const rolls = [];
        const summonData = [];
        for (const summon of this.summon) {
            let count = summon.count;
            const roll = new Roll(summon.count);
            if (!roll.isDeterministic) {
                await roll.evaluate();
                if (game.modules.get('dice-so-nice')?.active) rolls.push(roll);
                count = roll.total;
            }

            const actor = DHSummonField.getWorldActor(await foundry.utils.fromUuid(summon.actorUUID));
            /* Extending summon data in memory so it's available in actionField.toChat. Think it's harmless, but ugly. Could maybe find a better way. */
            summon.rolledCount = count;
            summon.actor = actor.toObject();

            summonData.push({ actor, count: count });
        }

        if (rolls.length) await Promise.all(rolls.map(roll => game.dice3d.showForRoll(roll, game.user, true)));

        this.actor.sheet?.minimize();
        DHSummonField.handleSummon(summonData, this.actor);
    }

    /* Check for any available instances of the actor present in the world if we're missing artwork in the compendium */
    static getWorldActor(baseActor) {
        const dataType = game.system.api.data.actors[`Dh${baseActor.type.capitalize()}`];
        if (baseActor.inCompendium && dataType && baseActor.img === dataType.DEFAULT_ICON) {
            const worldActorCopy = game.actors.find(x => x.name === baseActor.name);
            return worldActorCopy ?? baseActor;
        }

        return baseActor;
    }

    static async handleSummon(summonData, actionActor, summonIndex = 0) {
        const summon = summonData[summonIndex];
        const result = await CONFIG.ux.TokenManager.createPreviewAsync(summon.actor, {
            name: `${summon.actor.prototypeToken.name}${summon.count > 1 ? ` (${summon.count}x)` : ''}`
        });

        if (!result) return actionActor.sheet?.maximize();
        summon.actor = result.actor;

        summon.count--;
        if (summon.count <= 0) {
            summonIndex++;
            if (summonIndex === summonData.length) return actionActor.sheet?.maximize();
        }

        DHSummonField.handleSummon(summonData, actionActor, summonIndex);
    }
}
