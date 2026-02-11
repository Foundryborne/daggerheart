export default class DhProgress {
    #notification;

    constructor({ max, label = '' }) {
        this.max = max;
        this.label = label;
        this.#notification = ui.notifications.info(this.label, { progress: true });
    }

    updateMax(newMax) {
        this.max = newMax;
    }

    advance({ by = 1, label = this.label } = {}) {
        if (this.value === this.max) return;
        this.value = (this.value ?? 0) + Math.abs(by);
        this.#notification.update({ message: label, pct: this.value / this.max });
    }

    close({ label = '' } = {}) {
        this.#notification.update({ message: label, pct: 1 });
    }

    static createMigrationProgress(max = 0) {
        return new DhProgress({ max, label: game.i18n.localize('DAGGERHEART.UI.Progress.migrationLabel') });
    }
}
