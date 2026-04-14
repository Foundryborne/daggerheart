import { itemAbleRollParse } from '../../../helpers/utils.mjs';
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
            const roll = new Roll(itemAbleRollParse(summon.count, this.actor, this.item));
            await roll.evaluate();
            const count = roll.total;
            if (!roll.isDeterministic && game.modules.get('dice-so-nice')?.active) 
                rolls.push(roll);
            

            const actor = await DHSummonField.getWorldActor(await foundry.utils.fromUuid(summon.actorUUID));
            /* Extending summon data in memory so it's available in actionField.toChat. Think it's harmless, but ugly. Could maybe find a better way. */
            summon.actor = actor.toObject();

            const countNumber = Number.parseInt(count);
            for (let i = 0; i < countNumber; i++) {
                const remaining = countNumber - i;
                summonData.push({
                    actor,
                    tokenPreviewName: `${actor.prototypeToken.name}${remaining > 1 ? ` (${remaining}x)` : ''}`
                });
            }
        }

        if (rolls.length) await Promise.all(rolls.map(roll => game.dice3d.showForRoll(roll, game.user, true)));

        this.actor.sheet?.minimize();
        DHSummonField.handleSummon(summonData, this.actor);
    }

    /* Check for any available instances of the actor present in the world if we're missing artwork in the compendium. If none exists, create one. */
    static async getWorldActor(baseActor) {
        const dataType = game.system.api.data.actors[`Dh${baseActor.type.capitalize()}`];
        if (baseActor.inCompendium && dataType && baseActor.img === dataType.DEFAULT_ICON) {
            const worldActorCopy = game.actors.find(x => x.name === baseActor.name);
            if (worldActorCopy) return worldActorCopy;

            return await game.system.api.documents.DhpActor.create(baseActor.toObject());
        }

        return baseActor;
    }

    static async handleSummon(summonData, actionActor) {
        await CONFIG.ux.TokenManager.createTokensWithPreview(summonData, { elevation: actionActor.token?.elevation });

        return actionActor.sheet?.maximize();
    }
}
