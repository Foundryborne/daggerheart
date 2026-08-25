import { getWorldActor } from '../../../helpers/utils.mjs';

const fields = foundry.data.fields;

/**
 * @import DHSummonAction from '../../action/summonAction.mjs'
 */

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

    /**
     * Runs the execute. This is run on behalf of DHSummonAction.
     * @todo move this function to be on the summon action.
     * @this DHSummonAction
     */
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

        const activeTokens = this.actor.getActiveTokens(false, true);
        const controlledMatchingTokens = canvas.tokens.controlled
            .filter(x => x.actor && x.actor.uuid === this.actor.uuid)
            .map(x => x.document);
        /** @type {typeof game.system.api.documents.DhToken | null} */
        const token = this.actor.token ?? (
            activeTokens.length === 1 ? activeTokens[0] :
                (controlledMatchingTokens.length === 1 ? controlledMatchingTokens[0] : null)
        );

        if (!this.actor.token && !token) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.ACTIONS.TYPES.transform.linkedSelectedError'));
            return false;
        }

        if (!token) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.ACTIONS.TYPES.transform.prototypeError'));
            return false;
        }

        const actor = await getWorldActor(baseActor);
        const tokenSizes = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).tokenSizes;
        const tokenSize = actor?.system.metadata.usesSize ? tokenSizes[actor.system.size] : actor.prototypeToken.width;

        // Update token. Avoid using recursive: false, since that prevents animations
        await token.update(
            { ...actor.prototypeToken.toObject(), actorId: actor.id, width: tokenSize, height: tokenSize },
            { diff: false, noHook: true }
        );

        if (token.combatant) {
            this.actor.token.combatant.update({ actorId: actor.id, img: actor.prototypeToken.texture.src });
        }

        const marks = { hitPoints: 0, stress: 0 };
        if (!this.transform.resourceRefresh.hitPoints) {
            marks.hitPoints = Math.min(
                this.actor.system.resources.hitPoints.value,
                token.actor.system.resources.hitPoints.max - 1
            );
        }
        if (!this.transform.resourceRefresh.stress) {
            marks.stress = Math.min(
                this.actor.system.resources.stress.value,
                token.actor.system.resources.stress.max - 1
            );
        }
        if (marks.hitPoints || marks.stress) {
            token.actor.update({
                'system.resources': {
                    hitPoints: { value: marks.hitPoints },
                    stress: { value: marks.stress }
                }
            });
        }

        const prevPosition = { ...this.actor.sheet.position };
        this.actor.sheet.close();
        token.actor.sheet.render({ force: true, position: prevPosition });
        if (token.object.controlled) {
            ui.effectsDisplay.refresh();
        }
    }
}
