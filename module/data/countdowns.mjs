import { mapValues } from '../helpers/utils.mjs';
import { RefreshType, socketEvent } from '../systemRegistration/socket.mjs';
import FormulaField from './fields/formulaField.mjs';

/** 
 * The main setting data for the countdown editor
 */
export default class DhCountdowns extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            countdowns: new fields.TypedObjectField(new fields.EmbeddedDataField(DhCountdown)),
            hideNewCountdowns: new fields.BooleanField({
                required: true,
                nullable: false,
                initial: false
            })
        };
    }

    /** @inheritdoc */
    _initialize(options) {
        super._initialize(options);
        for (const [id, countdown] of Object.entries(this.countdowns)) {
            countdown.id = id;
        }
    }

    async handleChange() {
        const previousCountdowns = foundry.ui.countdowns.previousCountdownData;
        const changedCountdowns = Object.entries(this.countdowns).reduce((acc, [key, countdown]) => {
            const previous = previousCountdowns[key];
            const currentChanged = !previous || (previous.progress.current !== countdown.progress.current);
            if (currentChanged && previous?.progress.start === countdown.progress.start) {
                acc.push(key);
            }
            return acc;
        }, []);

        // Re-render countdowns applications. When the change is due to an actual update, resync the editor
        if (!foundry.utils.equals(previousCountdowns, this.countdowns)) {
            await foundry.ui.countdowns.render({ animate: changedCountdowns });
            for (const instance of game.system.api.applications.ui.CountdownEdit.instances()) {
                instance.data = this;
                await instance.render();
            }
        }

        // Inform modules of updates
        Hooks.callAll(socketEvent.Refresh, { refreshType: RefreshType.Countdown });
    }

    static migrateData(source) {
        const migrateOldCountdowns = (data, type) => {
            if (!data) return;
            for (const key of Object.keys(data.countdowns ?? {})) {
                const countdown = data.countdowns[key];
                source.countdowns[key] = {
                    ...countdown,
                    type: type,
                    ownership: Object.keys(countdown.ownership.players).reduce((acc, key) => {
                        acc[key] =
                            countdown.ownership.players[key].type === 1 ? 2 : countdown.ownership.players[key].type;
                        return acc;
                    }, {}),
                    progress: {
                        ...countdown.progress,
                        type: countdown.progress.type.value
                    }
                };
            }

            source[type] = null;
        };
        migrateOldCountdowns(source.narrative, 'narrative');
        migrateOldCountdowns(source.encounter, 'encounter');

        // Hidden was added to countdowns after 2.6.5, and Observer allows visibility despite that status
        // Before, countdowns used to be hidden by setting specific player ownerships to NONE.
        // The old behavior of INHERIT used to be based off the global setting and cannot be replicated
        const levels = CONST.DOCUMENT_OWNERSHIP_LEVELS;
        for (const countdown of Object.values(source.countdowns ?? {})) {
            const wasHidden = Object.values(countdown.ownership ?? {}).some(v => v === levels.NONE);
            if (wasHidden) {
                countdown.hidden = true;
                countdown.ownership = mapValues(
                    countdown.ownership, 
                    v => v === levels.NONE ? levels.INHERIT : Math.max(levels.OBSERVER, v)
                );
            }
        }

        return super.migrateData(source);
    }
}

export class DhCountdown extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            type: new fields.StringField({
                required: true,
                choices: CONFIG.DH.GENERAL.countdownTypes,
                initial: CONFIG.DH.GENERAL.countdownTypes.encounter.id,
                label: 'DAGGERHEART.GENERAL.type'
            }),
            name: new fields.StringField({
                required: true,
                label: 'DAGGERHEART.APPLICATIONS.Countdown.FIELDS.countdowns.element.name.label'
            }),
            img: new fields.FilePathField({
                categories: ['IMAGE'],
                base64: false,
                initial: 'icons/magic/time/hourglass-yellow-green.webp'
            }),
            hidden: new fields.BooleanField({ 
                required: true,
                nullable: false,
                initial: false,
                label: 'DAGGERHEART.APPLICATIONS.Countdown.FIELDS.countdowns.element.hidden.label'
            }),
            ownership: new fields.TypedObjectField(
                new fields.NumberField({
                    required: true,
                    choices: CONFIG.DH.GENERAL.countdownOwnershipLevels,
                    initial: CONST.DOCUMENT_OWNERSHIP_LEVELS.INHERIT
                })
            ),
            progress: new fields.SchemaField({
                current: new fields.NumberField({
                    required: true,
                    integer: true,
                    initial: 1,
                    label: 'DAGGERHEART.APPLICATIONS.Countdown.FIELDS.countdowns.element.progress.current.label'
                }),
                start: new fields.NumberField({
                    required: true,
                    integer: true,
                    initial: 1,
                    label: 'DAGGERHEART.APPLICATIONS.Countdown.FIELDS.countdowns.element.progress.start.label',
                    deterministic: false
                }),
                startFormula: new FormulaField({
                    label: 'DAGGERHEART.APPLICATIONS.Countdown.FIELDS.countdowns.element.progress.startFormula.label',
                    deterministic: false
                }),
                looping: new fields.StringField({
                    required: true,
                    choices: CONFIG.DH.GENERAL.countdownLoopingTypes,
                    initial: CONFIG.DH.GENERAL.countdownLoopingTypes.noLooping.id,
                    label: 'DAGGERHEART.APPLICATIONS.Countdown.FIELDS.countdowns.element.progress.looping.label'
                }),
                type: new fields.StringField({
                    required: true,
                    choices: CONFIG.DH.GENERAL.countdownProgressionTypes,
                    initial: CONFIG.DH.GENERAL.countdownProgressionTypes.custom.id,
                    label: 'DAGGERHEART.APPLICATIONS.Countdown.FIELDS.countdowns.element.type.label'
                })
            })
        };
    }

    static defaultCountdown(type, playerHidden) {        
        return {
            type: type ?? CONFIG.DH.GENERAL.countdownTypes.encounter.id,
            name: game.i18n.localize('DAGGERHEART.APPLICATIONS.Countdown.newCountdown'),
            img: 'icons/magic/time/hourglass-yellow-green.webp',
            hidden: playerHidden,
            progress: {
                current: 1,
                start: 1
            }
        };
    }

    get playerOwnership() {
        return Array.from(game.users).reduce((acc, user) => {
            acc[user.id] = {
                value: user.isGM
                    ? CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
                    : this.ownership.players[user.id] && this.ownership.players[user.id].type !== -1
                        ? this.ownership.players[user.id].type
                        : this.ownership.default,
                isGM: user.isGM
            };

            return acc;
        }, {});
    }

    /**
     * A boolean indicator for whether the current game User can see this countdown
     * @returns {boolean}
     */
    get visible() {
        return this.getUserLevel(game.user) !== CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE;
    }

    /**
     * A boolean indicator for whether the current game User has ownership rights for this countdown
     * @returns {boolean}
     */
    get isOwner() {
        return this.getUserLevel(game.user) === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
    }

    /** @inheritDoc */
    static migrateData(source) {
        if (source.progress?.max) {
            source.progress.start = Number(source.progress.max);
            source.progress.max = null;
            source.progress.startFormula = null;
        }

        return super.migrateData(source);
    }

    /**
     * Get the explicit permission level that a User has over this Document, a value in CONST.DOCUMENT_OWNERSHIP_LEVELS.
     * Compendium content ignores the ownership field in favor of User role-based ownership. Otherwise, Documents use
     * granular per-User ownership definitions and Embedded Documents defer to their parent ownership.
     *
     * @param {BaseUser} [user=game.user] The User being tested
     * @returns {import('@common/constants.mjs').DocumentOwnershipNumber} A numeric permission level from {@link CONST.DOCUMENT_OWNERSHIP_LEVELS}
     */
    getUserLevel(user) {
        if (user.isGM) return CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;

        const playerOwnership = this.ownership[user.id];
        return playerOwnership === undefined || playerOwnership === CONST.DOCUMENT_OWNERSHIP_LEVELS.INHERIT
            ? (this.hidden ? CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE : CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)
            : playerOwnership;
    }

    async delete() {
        const setting = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns);
        const data = foundry.utils.deepClone(setting._source);
        delete data.countdowns[this.id];
        await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns, data);
    }

    async toggleVisibility() {
        const setting = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns);
        await setting.updateSource({[`countdowns.${this.id}.hidden`]: !setting.countdowns[this.id].hidden})
        await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Countdowns, setting);
    }
}
