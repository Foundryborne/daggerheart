import { emitGMUpdate, GMUpdateEvent, RefreshType, socketEvent } from '../../../systemRegistration/socket.mjs';
import { NullableBooleanField } from '../nullableBooleanField.mjs';

const fields = foundry.data.fields;

export default class CountdownField extends fields.ArrayField {
    constructor(options = {}, context = {}) {
        const element = new fields.SchemaField({
            ...game.system.api.data.countdowns.DhCountdown.defineSchema(),
            type: new fields.StringField({
                required: true,
                choices: CONFIG.DH.GENERAL.countdownTypes,
                initial: CONFIG.DH.GENERAL.countdownTypes.encounter.id,
                label: 'DAGGERHEART.GENERAL.type'
            }),
            name: new fields.StringField({
                required: true,
                initial: game.i18n.localize('DAGGERHEART.APPLICATIONS.Countdown.newCountdown'),
                label: 'DAGGERHEART.APPLICATIONS.Countdown.FIELDS.countdowns.element.name.label'
            }),
            // Hidden is nullable to allow defaulting to the global setting
            hidden: new NullableBooleanField({
                required: true,
                nullable: true,
                initial: false,
                label: 'DAGGERHEART.APPLICATIONS.Countdown.FIELDS.countdowns.element.hidden.label'
            }, { nullLabel: 'DAGGERHEART.APPLICATIONS.Countdown.hiddenNullLabel' })
        });
        super(element, options, context);
    }

    /**
     * Countdown Action Workflow part.
     * Must be called within Action context or similar. Requires a GM online to edit the game setting for countdowns.
     * @param {object} config    Object that contains workflow datas. Usually made from Action Fields prepareConfig methods.
     */
    static async execute(config) {
        const noGM = !game.users.find(x => x.isGM && x.active);
        if (noGM) {
            ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.gmRequired'));
            return;
        }

        const data = { countdowns: {} };
        const countdownMessages = [];
        for (let countdown of config.countdowns) {
            let startFormula = countdown.progress.startFormula ? countdown.progress.startFormula : null;
            let countdownStart = startFormula ?? '1';
            if (startFormula) {
                const roll = await new Roll(startFormula).roll();
                if (roll.dice.length > 0) {
                    countdownStart = roll.total;
                    const message = await roll.toMessage();
                    countdownMessages.push(message);
                } else {
                    startFormula = null;
                }
            }

            const setting = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns);
            data.countdowns[foundry.utils.randomID()] = {
                ...countdown,
                hidden: countdown.hidden ?? setting.hideNewCountdowns,
                progress: {
                    ...countdown.progress,
                    current: countdownStart,
                    start: countdownStart,
                    startFormula
                }
            };
        }

        if (game.dice3d) {
            await Promise.all(
                countdownMessages.map(message => {
                    return game.dice3d.waitFor3DAnimationByMessageID(message.id);
                })
            );
        }

        await emitGMUpdate(
            GMUpdateEvent.UpdateCountdowns,
            async () => {
                const countdownSetting = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns);
                await countdownSetting.updateSource(data);
                await game.settings.set(
                    CONFIG.DH.id,
                    CONFIG.DH.SETTINGS.gameSettings.Countdowns,
                    countdownSetting.toObject()
                );
                game.socket.emit(`system.${CONFIG.DH.id}`, {
                    action: socketEvent.Refresh,
                    data: { refreshType: RefreshType.Countdown }
                });
                Hooks.callAll(socketEvent.Refresh, { refreshType: RefreshType.Countdown });
            },
            data,
            null,
            {
                refreshType: RefreshType.Countdown
            }
        );
    }

    /**
     * Update Action Workflow config object.
     * Must be called within Action context.
     * @param {object} config    Object that contains workflow datas. Usually made from Action Fields prepareConfig methods.
     */
    prepareConfig(config) {
        config.countdowns = this.countdown;
        return config;
    }
}
