export function handleSocketEvent({ action = null, data = {} } = {}) {
    switch (action) {
        case socketEvent.GMUpdate:
            Hooks.callAll(socketEvent.GMUpdate, data.action, data.uuid, data.update);
            break;
        case socketEvent.DhpFearUpdate:
            Hooks.callAll(socketEvent.DhpFearUpdate);
            break;
    }
}

export const socketEvent = {
    GMUpdate: 'DhpGMUpdate',
    DhpFearUpdate: 'DhpFearUpdate'
};

export const GMUpdateEvent = {
    UpdateDocument: 'DhpGMUpdateDocument',
    UpdateFear: 'DhpUpdateFear'
};
