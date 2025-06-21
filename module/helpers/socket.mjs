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
    UpdateSetting: 'DhGMUpdateSetting',
    UpdateFear: 'DhGMUpdateFear'
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
                    if (document && data.update) {
                        await document.update(data.update);
                    }
                    break;
                case GMUpdateEvent.UpdateSetting:
                    if (game.user.isGM) {
                        await game.settings.set(SYSTEM.id, data.uuid, data.update);
                    }
                    break;
                case GMUpdateEvent.UpdateFear:
                    if (game.user.isGM) {
                        await game.settings.set(
                            SYSTEM.id,
                            SYSTEM.SETTINGS.gameSettings.Resources.Fear,
                            Math.max(Math.min(data.update, 6), 0)
                        );
                        Hooks.callAll(socketEvent.DhpFearUpdate);
                        await game.socket.emit(`system.${SYSTEM.id}`, { action: socketEvent.DhpFearUpdate });
                    }
                    break;
            }

            if (data.refresh) {
                await game.socket.emit(`system.${SYSTEM.id}`, {
                    action: socketEvent.Refresh,
                    data: data.refresh
                });
                Hooks.call(socketEvent.Refresh, data.refresh);
            }
        }
    });
};
