import DamageReductionDialog from '../applications/dialogs/damageReductionDialog.mjs';

export function handleSocketEvent({ action = null, data = {} } = {}) {
    switch (action) {
        case socketEvent.GMUpdate:
            Hooks.callAll(socketEvent.GMUpdate, data);
            break;
        case socketEvent.DhpFearUpdate:
            Hooks.callAll(socketEvent.DhpFearUpdate);
            break;
        case socketEvent.Refresh:
            Hooks.call(socketEvent.Refresh, data);
            break;
    }
}

export const socketEvent = {
    GMUpdate: 'DhGMUpdate',
    Refresh: 'DhRefresh',
    DhpFearUpdate: 'DhFearUpdate'
};

export const GMUpdateEvent = {
    UpdateDocument: 'DhGMUpdateDocument',
    UpdateEffect: 'DhGMUpdateEffect',
    UpdateSetting: 'DhGMUpdateSetting',
    UpdateFear: 'DhGMUpdateFear',
    UpdateSaveMessage: 'DhGMUpdateSaveMessage'
};

export const RefreshType = {
    Countdown: 'DhCoundownRefresh'
};

export const registerSocketHooks = () => {
    Hooks.on(socketEvent.GMUpdate, async data => {
        if (game.user.isGM) {
            const document = data.uuid ? await fromUuid(data.uuid) : null;
            switch (data.action) {
                case GMUpdateEvent.UpdateDocument:
                    if (document && data.update)
                        await document.update(data.update);
                    break;
                case GMUpdateEvent.UpdateEffect:
                    if (document && data.update)
                        await game.system.api.fields.ActionFields.EffectsField.applyEffects.call(document, data.update);
                    break;
                case GMUpdateEvent.UpdateSetting:
                    await game.settings.set(CONFIG.DH.id, data.uuid, data.update);
                    break;
                case GMUpdateEvent.UpdateFear:
                    await game.settings.set(
                        CONFIG.DH.id,
                        CONFIG.DH.SETTINGS.gameSettings.Resources.Fear,
                        Math.max(
                            0,
                            Math.min(
                                game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).maxFear,
                                data.update
                            )
                        )
                    );
                    break;
                case GMUpdateEvent.UpdateSaveMessage:
                    const action = await fromUuid(data.update.action),
                        message = game.messages.get(data.update.message);
                    if (!action || !message) return;
                    action.updateSaveMessage(data.update.result, message, data.update.token);
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
};

export const registerUserQueries = () => {
    CONFIG.queries.armorSlot = DamageReductionDialog.armorSlotQuery;
    CONFIG.queries.reactionRoll = game.system.api.fields.ActionFields.SaveField.rollSaveQuery;
};

export const emitAsGM = async (eventName, callback, update, uuid = null) => {
    if (!game.user.isGM) {
        return await game.socket.emit(`system.${CONFIG.DH.id}`, {
            action: socketEvent.GMUpdate,
            data: {
                action: eventName,
                uuid,
                update
            }
        });
    } else return callback(update);
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
