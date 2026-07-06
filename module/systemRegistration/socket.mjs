import DamageReductionDialog from '../applications/dialogs/damageReductionDialog.mjs';
import PartySheet from '../applications/sheets/actors/party.mjs';

export function handleSocketEvent({ action = null, data = {} } = {}) {
    switch (action) {
        case socketEvent.GMUpdate:
            Hooks.callAll(socketEvent.GMUpdate, data);
            break;
        case socketEvent.GMCreate:
            Hooks.callAll(socketEvent.GMCreate, data);
            break;
        case socketEvent.DhpFearUpdate:
            Hooks.callAll(socketEvent.DhpFearUpdate);
            break;
        case socketEvent.Refresh:
            Hooks.call(socketEvent.Refresh, data);
            break;
        case socketEvent.DowntimeTrigger:
            PartySheet.downtimeMoveQuery(data);
            break;
        case socketEvent.TagTeamStart:
            Hooks.callAll(CONFIG.DH.HOOKS.hooksConfig.tagTeamStart, data);
            break;
        case socketEvent.GroupRollStart:
            Hooks.callAll(CONFIG.DH.HOOKS.hooksConfig.groupRollStart, data);
    }
}

export const socketEvent = {
    GMUpdate: 'DhGMUpdate',
    GMCreate: 'DhGMCreate',
    Refresh: 'DhRefresh',
    DhpFearUpdate: 'DhFearUpdate',
    DowntimeTrigger: 'DowntimeTrigger',
    TagTeamStart: 'DhTagTeamStart',
    GroupRollStart: 'DhGroupRollStart'
};

export const GMUpdateEvent = {
    UpdateDocument: 'DhGMUpdateDocument',
    UpdateEffect: 'DhGMUpdateEffect',
    UpdateSetting: 'DhGMUpdateSetting',
    UpdateFear: 'DhGMUpdateFear',
    UpdateCountdowns: 'DhGMUpdateCountdowns',
    UpdateSaveMessage: 'DhGMUpdateSaveMessage'
};

export const RefreshType = {
    Countdown: 'DhCoundownRefresh',
    TagTeamRoll: 'DhTagTeamRollRefresh',
    GroupRoll: 'DhGroupRollRefresh',
    EffectsDisplay: 'DhEffectsDisplayRefresh',
    Scene: 'DhSceneRefresh',
    CompendiumBrowser: 'DhCompendiumBrowserRefresh'
};

export const registerSocketHooks = () => {
    Hooks.on(socketEvent.GMUpdate, async data => {
        if (game.user.isGM) {
            const document = data.uuid ? await fromUuid(data.uuid) : null;
            switch (data.action) {
                case GMUpdateEvent.UpdateDocument:
                    if (document && data.data) await document.update(data.data);
                    break;
                case GMUpdateEvent.UpdateEffect:
                    if (document && data.data)
                        await game.system.api.fields.ActionFields.EffectsField.applyEffects.call(document, data.data);
                    break;
                case GMUpdateEvent.UpdateSetting:
                    await game.settings.set(CONFIG.DH.id, data.uuid, data.data);
                    break;
                case GMUpdateEvent.UpdateFear:
                    await game.settings.set(
                        CONFIG.DH.id,
                        CONFIG.DH.SETTINGS.gameSettings.Resources.Fear,
                        Math.max(
                            0,
                            Math.min(
                                game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).maxFear,
                                data.data
                            )
                        )
                    );
                    break;
                case GMUpdateEvent.UpdateCountdowns:
                    await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns, data.data);
                    Hooks.callAll(socketEvent.Refresh, { refreshType: RefreshType.Countdown });
                    break;
                case GMUpdateEvent.UpdateSaveMessage:
                    const message = game.messages.get(data.data.message);
                    if (!message) return;
                    game.system.api.fields.ActionFields.SaveField.updateSaveMessage(
                        data.data.result,
                        message,
                        data.data.token
                    );
                    break;
            }

            if (data.refresh) {
                await game.socket.emit(`system.${CONFIG.DH.id}`, {
                    action: socketEvent.Refresh,
                    data: data.refresh
                });
                Hooks.call(socketEvent.Refresh, data.refresh);
            }
        }
    });

    Hooks.on(socketEvent.GMCreate, async ({ data, documentType, scene }) => {
        if (!game.user.isGM) return;

        switch (documentType) {
            default:
                const cls = getDocumentClass(documentType);
                cls.create(data, { parent: game.scenes.get(scene) });
                break;
        }
    });
};

export const registerUserQueries = () => {
    CONFIG.queries.armorSlot = DamageReductionDialog.armorSlotQuery;
    CONFIG.queries.reactionRoll = game.system.api.fields.ActionFields.SaveField.rollSaveQuery;
};

export const emitGMUpdate = async (eventName, callback, update, uuid = null, refresh = null) => {
    return await emitAsGM(socketEvent.GMUpdate, { action: eventName, callback, data: update, uuid, refresh });
};

export const emitGMCreate = async (documentType, callback, data, scene) => {
    return await emitAsGM(socketEvent.GMCreate, { documentType, callback, data, scene });
};

export const emitAsGM = async (event, data = { callback: () => {}, data: {} }) => {
    if (!game.user.isGM) {
        return await game.socket.emit(`system.${CONFIG.DH.id}`, {
            action: event,
            data: data
        });
    } else return data.callback(data.data);
};

export const emitAsOwner = (eventName, userId, args) => {
    if (userId === game.user.id) return;
    if (!eventName || !userId) return false;
    game.socket.emit(`system.${CONFIG.DH.id}`, {
        action: eventName,
        data: {
            userId,
            ...args
        }
    });
    return false;
};
