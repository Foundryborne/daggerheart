import { GMUpdateEvent, socketEvent } from '../helpers/socket.mjs';

export default class DhpPlayers extends foundry.applications.ui.Players {
    constructor(data, context) {
        super(data, context);

        Hooks.on(socketEvent.DhpFearUpdate, this.onFearUpdate);
    }

    get template() {
        return 'systems/daggerheart/templates/ui/players.hbs';
    }

    async getData(options = {}) {
        const context = super.getData(options);
        context.fear = await game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Resources.Fear);
        context.user = game.user;

        return context;
    }

    activateListeners(html) {
        // Toggle online/offline
        html.find('.players-mode').click(this._onToggleOfflinePlayers.bind(this));
        html.find('.fear-control.up').click(async event => await this.updateFear(event, 1));
        html.find('.fear-control.down').click(async event => await this.updateFear(event, -1));

        // Context menu
        const contextOptions = this._getUserContextOptions();
        Hooks.call('getUserContextOptions', html, contextOptions);
        new ContextMenu(html, '.player', contextOptions);
    }

    async updateFear(_, change) {
        const fear = await game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Resources.Fear);
        const value = Math.max(Math.min(fear + change, 6), 0);
        Hooks.callAll(socketEvent.GMUpdate, GMUpdateEvent.UpdateFear, null, value);
        await game.socket.emit(`system.${SYSTEM.id}`, {
            action: socketEvent.GMUpdate,
            data: { action: GMUpdateEvent.UpdateFear, update: value }
        });
    }

    onFearUpdate = async () => {
        this.render(true);
    };

    async close(options) {
        Hooks.off(socketEvent.DhpFearUpdate, this.onFearUpdate);

        return super.close(options);
    }
}
