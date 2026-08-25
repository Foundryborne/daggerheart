import { getWorldActor, itemAbleRollParse, triggerChatRollFx } from '../../../helpers/utils.mjs';
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

    static async execute(config) {
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
        const chatMessageData = [];
        for (const summon of this.summon) {
            const roll = new Roll(itemAbleRollParse(summon.count, this.actor, this.item));
            await roll.evaluate();
            const count = roll.total;
            if (!roll.isDeterministic) rolls.push(roll);

            const actor = await getWorldActor(await foundry.utils.fromUuid(summon.actorUUID));
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

            chatMessageData.push({
                data: actor,
                quantity: countNumber
            });
        }

        if (rolls.length) await triggerChatRollFx(rolls);

        this.actor.sheet?.minimize();
        await CONFIG.ux.TokenManager.createTokensWithPreview(summonData, { elevation: this.actor.token?.elevation });
        this.actor.sheet?.maximize();
        config.summonData = chatMessageData;
    }
}
