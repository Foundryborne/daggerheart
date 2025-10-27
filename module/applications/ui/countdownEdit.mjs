import { DhCountdown } from '../../data/countdowns.mjs';
import { emitAsGM, GMUpdateEvent, RefreshType, socketEvent } from '../../systemRegistration/socket.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class CountdownEdit extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor() {
        super();

        this.data = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns);
        this.editingCountdowns = new Set();
        this.currentEditCountdown = null;
        this.hideNewCountdowns = false;
    }

    static DEFAULT_OPTIONS = {
        classes: ['daggerheart', 'dialog', 'dh-style', 'countdown-edit'],
        tag: 'form',
        position: { width: 600 },
        window: {
            title: 'DAGGERHEART.APPLICATIONS.CountdownEdit.title',
            icon: 'fa-solid fa-clock-rotate-left'
        },
        actions: {
            addCountdown: CountdownEdit.#addCountdown,
            toggleCountdownEdit: CountdownEdit.#toggleCountdownEdit,
            editCountdownImage: CountdownEdit.#editCountdownImage,
            editCountdownOwnership: CountdownEdit.#editCountdownOwnership,
            removeCountdown: CountdownEdit.#removeCountdown
        },
        form: { handler: this.updateData, submitOnChange: true }
    };

    static PARTS = {
        countdowns: {
            template: 'systems/daggerheart/templates/ui/countdown-edit.hbs',
            scrollable: ['.expanded-view', '.edit-content']
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.isGM = game.user.isGM;
        context.ownershipDefaultOptions = CONFIG.DH.GENERAL.basicOwnershiplevels;
        context.defaultOwnership = this.data.defaultOwnership;
        context.countdownBaseTypes = CONFIG.DH.GENERAL.countdownBaseTypes;
        context.countdownTypes = CONFIG.DH.GENERAL.countdownTypes;
        context.hideNewCountdowns = this.hideNewCountdowns;
        context.countdowns = Object.keys(this.data.countdowns).reduce((acc, key) => {
            const countdown = this.data.countdowns[key];
            acc[key] = {
                ...countdown,
                typeName: game.i18n.localize(CONFIG.DH.GENERAL.countdownBaseTypes[countdown.type].name),
                progress: {
                    ...countdown.progress,
                    typeName: game.i18n.localize(CONFIG.DH.GENERAL.countdownTypes[countdown.progress.type].label)
                },
                editing: this.editingCountdowns.has(key)
            };

            return acc;
        }, {});

        return context;
    }

    /** @override */
    async _postRender(_context, _options) {
        if (this.currentEditCountdown) {
            setTimeout(() => {
                const input = this.element.querySelector(
                    `.countdown-edit-container[data-id="${this.currentEditCountdown}"] input`
                );
                if (input) {
                    input.select();
                    this.currentEditCountdown = null;
                }
            }, 100);
        }
    }

    canPerformEdit() {
        if (game.user.isGM) return true;

        if (!game.users.activeGM) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.gmRequired'));
            return false;
        }

        return true;
    }

    async updateSetting(update) {
        const noGM = !game.users.find(x => x.isGM && x.active);
        if (noGM) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.gmRequired'));
            return;
        }

        await this.data.updateSource(update);
        await emitAsGM(GMUpdateEvent.UpdateCountdowns, this.gmSetSetting.bind(this.data), this.data, null, {
            refreshType: RefreshType.Countdown
        });

        this.render();
    }

    static async updateData(_event, _, formData) {
        const { hideNewCountdowns, ...settingsData } = foundry.utils.expandObject(formData.object);

        // Sync current and max if max is changing and they were equal before
        for (const [id, countdown] of Object.entries(settingsData.countdowns ?? {})) {
            const existing = this.data.countdowns[id];
            const wasEqual = existing && existing.progress.current === existing.progress.max;
            if (wasEqual && countdown.progress.max !== existing.progress.max) {
                countdown.progress.current = countdown.progress.max;
            } else {
                countdown.progress.current = Math.min(countdown.progress.current, countdown.progress.max);
            }
        }

        this.hideNewCountdowns = hideNewCountdowns;
        this.updateSetting(settingsData);
    }

    async gmSetSetting(data) {
        await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns, data),
            game.socket.emit(`system.${CONFIG.DH.id}`, {
                action: socketEvent.Refresh,
                data: { refreshType: RefreshType.Countdown }
            });
        Hooks.callAll(socketEvent.Refresh, { refreshType: RefreshType.Countdown });
    }

    static #addCountdown() {
        const id = foundry.utils.randomID();
        this.editingCountdowns.add(id);
        this.currentEditCountdown = id;
        this.updateSetting({
            [`countdowns.${id}`]: DhCountdown.defaultCountdown(null, this.hideNewCountdowns)
        });
    }

    static #editCountdownImage(_, target) {
        const countdown = this.data.countdowns[target.id];
        const fp = new foundry.applications.apps.FilePicker.implementation({
            current: countdown.img,
            type: 'image',
            callback: async path => this.updateSetting({ [`countdowns.${target.id}.img`]: path }),
            top: this.position.top + 40,
            left: this.position.left + 10
        });
        return fp.browse();
    }

    static #toggleCountdownEdit(_, button) {
        const { countdownId } = button.dataset;

        const isEditing = this.editingCountdowns.has(countdownId);
        if (isEditing) this.editingCountdowns.delete(countdownId);
        else {
            this.editingCountdowns.add(countdownId);
            this.currentEditCountdown = countdownId;
        }

        this.render();
    }

    static async #editCountdownOwnership(_, button) {
        const countdown = this.data.countdowns[button.dataset.countdownId];
        const data = await game.system.api.applications.dialogs.OwnershipSelection.configure(
            countdown.name,
            countdown.ownership,
            this.data.defaultOwnership
        );
        if (!data) return;

        this.updateSetting({ [`countdowns.${button.dataset.countdownId}`]: data });
    }

    static async #removeCountdown(event, button) {
        const { countdownId } = button.dataset;

        if (!event.shiftKey) {
            const confirmed = await foundry.applications.api.DialogV2.confirm({
                window: {
                    title: game.i18n.localize('DAGGERHEART.APPLICATIONS.CountdownEdit.removeCountdownTitle')
                },
                content: game.i18n.format('DAGGERHEART.APPLICATIONS.CountdownEdit.removeCountdownText', {
                    name: this.data.countdowns[countdownId].name
                })
            });
            if (!confirmed) return;
        }

        if (this.editingCountdowns.has(countdownId)) this.editingCountdowns.delete(countdownId);
        this.updateSetting({ [`countdowns.-=${countdownId}`]: null });
    }
}
