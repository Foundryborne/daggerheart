import { RefreshType, socketEvent } from '../systemRegistration/socket.mjs';

export default class DhCountdowns extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            /* Outdated and unused. Needed for migration. Remove in next minor version. (1.3) */
            narrative: new fields.EmbeddedDataField(DhCountdownData),
            encounter: new fields.EmbeddedDataField(DhCountdownData),
            /**/
            countdowns: new fields.TypedObjectField(new fields.EmbeddedDataField(DhCountdown)),
            defaultOwnership: new fields.NumberField({
                required: true,
                choices: CONFIG.DH.GENERAL.basicOwnershiplevels,
                initial: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER
            })
        };
    }
}

/* Outdated and unused. Needed for migration. Remove in next minor version. (1.3) */
class DhCountdownData extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            countdowns: new fields.TypedObjectField(new fields.EmbeddedDataField(DhCountdown)),
            ownership: new fields.SchemaField({
                default: new fields.NumberField({
                    required: true,
                    choices: Object.values(CONST.DOCUMENT_OWNERSHIP_LEVELS),
                    initial: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE
                }),
                players: new fields.TypedObjectField(
                    new fields.SchemaField({
                        type: new fields.NumberField({
                            required: true,
                            choices: Object.values(CONST.DOCUMENT_OWNERSHIP_LEVELS),
                            initial: CONST.DOCUMENT_OWNERSHIP_LEVELS.INHERIT
                        })
                    })
                )
            }),
            window: new fields.SchemaField({})
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
}

export class DhCountdown extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            type: new fields.StringField({
                required: true,
                choices: CONFIG.DH.GENERAL.countdownBaseTypes,
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
            ownership: new fields.TypedObjectField(
                new fields.NumberField({
                    required: true,
                    choices: CONFIG.DH.GENERAL.simpleOwnershiplevels,
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
                max: new fields.NumberField({
                    required: true,
                    integer: true,
                    initial: 1,
                    label: 'DAGGERHEART.APPLICATIONS.Countdown.FIELDS.countdowns.element.progress.max.label'
                }),
                type: new fields.StringField({
                    required: true,
                    choices: CONFIG.DH.GENERAL.countdownTypes,
                    initial: CONFIG.DH.GENERAL.countdownTypes.custom.id,
                    label: 'DAGGERHEART.APPLICATIONS.Countdown.FIELDS.countdowns.element.type.label'
                })
            })
        };
    }

    static defaultCountdown(type) {
        return {
            type: type ?? CONFIG.DH.GENERAL.countdownBaseTypes.narrative.id,
            name: game.i18n.localize('DAGGERHEART.APPLICATIONS.Countdown.newCountdown'),
            img: 'icons/magic/time/hourglass-yellow-green.webp',
            progress: {
                current: 1,
                max: 1
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
}

export const registerCountdownHooks = () => {
    Hooks.on(socketEvent.Refresh, ({ refreshType, application }) => {
        if (refreshType === RefreshType.Countdown) {
            if (application) {
                foundry.applications.instances.get(application)?.render();
            } else {
                foundry.applications.instances.get('narrative-countdowns')?.render();
                foundry.applications.instances.get('encounter-countdowns')?.render();
            }

            return false;
        }
    });
};
