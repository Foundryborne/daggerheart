import { RefreshType, socketEvent } from '../systemRegistration/socket.mjs';

export default class DhCountdowns extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            narrative: new fields.EmbeddedDataField(DhCountdownData),
            encounter: new fields.EmbeddedDataField(DhCountdownData)
        };
    }

    static CountdownCategories = { narrative: 'narrative', combat: 'combat' };
}

class DhCountdownData extends foundry.abstract.DataModel {
    static LOCALIZATION_PREFIXES = ['DAGGERHEART.APPLICATIONS.Countdown']; // Nots ure why this won't work. Setting labels manually for now

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

class DhCountdown extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            name: new fields.StringField({
                required: true,
                label: 'DAGGERHEART.APPLICATIONS.Countdown.FIELDS.countdowns.element.name.label'
            }),
            img: new fields.FilePathField({
                categories: ['IMAGE'],
                base64: false,
                initial: 'icons/magic/time/hourglass-yellow-green.webp'
            }),
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
                type: new fields.SchemaField({
                    value: new fields.StringField({
                        required: true,
                        choices: CONFIG.DH.GENERAL.countdownTypes,
                        initial: CONFIG.DH.GENERAL.countdownTypes.custom.id,
                        label: 'DAGGERHEART.APPLICATIONS.Countdown.FIELDS.countdowns.element.progress.type.value.label'
                    }),
                    label: new fields.StringField({
                        label: 'DAGGERHEART.APPLICATIONS.Countdown.FIELDS.countdowns.element.progress.type.label.label'
                    })
                })
            })
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
