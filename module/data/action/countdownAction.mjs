import DHBaseAction from './baseAction.mjs';

export default class DhCountdownAction extends DHBaseAction {
    static extraSchemas = [...super.extraSchemas, 'countdown'];

    get defaultValues() {
        return {
            ...super.defaultValues,
            countdown: {
                name: this.parent.parent.name,
                img: this.img,
                progress: {
                    startFormula: '1'
                }
            }
        };
    }

    /** @inheritdoc */
    static getSourceConfig(parent) {
        const updateSource = game.system.api.data.actions.actionsTypes.base.getSourceConfig(parent);
        updateSource.name = game.i18n.localize('DAGGERHEART.ACTIONS.Config.countdown.startCountdown');
        updateSource['countdown'] = [
            {
                ...game.system.api.data.countdowns.DhCountdown.defaultCountdown(),
                name: parent.parent.name,
                img: parent.parent.img,
                progress: {
                    startFormula: '1'
                }
            }
        ];

        return updateSource;
    }

    /** @inheritDoc */
    static migrateData(source) {
        for (const countdown of source.countdown) {
            if (countdown.progress.max) {
                countdown.progress.startFormula = countdown.progress.max;
                countdown.progress.start = 1;
                countdown.progress.max = null;
            }
        }

        return super.migrateData(source);
    }
}
