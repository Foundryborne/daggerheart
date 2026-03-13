import BaseDataActor from './base.mjs';
import ForeignDocumentUUIDArrayField from '../fields/foreignDocumentUUIDArrayField.mjs';
import DHEnvironmentSettings from '../../applications/sheets-configs/environment-settings.mjs';
import { RefreshType, socketEvent } from '../../systemRegistration/socket.mjs';

export default class DhEnvironment extends BaseDataActor {
    scenes = new Set();

    /**@override */
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.ACTORS.Environment'];

    /**@inheritdoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Actor.environment',
            type: 'environment',
            settingSheet: DHEnvironmentSettings,
            hasResistances: false,
            hasAttribution: true
        });
    }

    /**@inheritdoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            tier: new fields.NumberField({
                required: true,
                integer: true,
                choices: CONFIG.DH.GENERAL.tiers,
                initial: CONFIG.DH.GENERAL.tiers[1].id
            }),
            type: new fields.StringField({ choices: CONFIG.DH.ACTOR.environmentTypes }),
            impulses: new fields.StringField(),
            difficulty: new fields.NumberField({ required: true, initial: 11, integer: true }),
            potentialAdversaries: new fields.TypedObjectField(
                new fields.SchemaField({
                    label: new fields.StringField(),
                    adversaries: new ForeignDocumentUUIDArrayField({ type: 'Actor' })
                })
            ),
            notes: new fields.HTMLField()
        };
    }

    /* -------------------------------------------- */

    /**@inheritdoc */
    static DEFAULT_ICON = 'systems/daggerheart/assets/icons/documents/actors/forest.svg';

    /* -------------------------------------------- */

    get features() {
        return this.parent.items.filter(x => x.type === 'feature');
    }

    isItemValid(source) {
        return source.type === 'feature';
    }

    _onUpdate(changes, options, userId) {
        super._onUpdate(changes, options, userId);
        for (const scene of this.scenes) {
            scene.render();
        }
    }

    _onDelete(options, userId) {
        super._onDelete(options, userId);
        for (const scene of this.scenes) {
            if (game.user.isActiveGM) {
                const newSceneEnvironments = scene.flags.daggerheart.sceneEnvironments.filter(
                    x => x !== this.parent.uuid
                );
                scene.update({ 'flags.daggerheart.sceneEnvironments': newSceneEnvironments }).then(() => {
                    Hooks.callAll(socketEvent.Refresh, { refreshType: RefreshType.Scene });
                    game.socket.emit(`system.${CONFIG.DH.id}`, {
                        action: socketEvent.Refresh,
                        data: { refreshType: RefreshType.TagTeamRoll }
                    });
                });
            }
        }
    }
}
