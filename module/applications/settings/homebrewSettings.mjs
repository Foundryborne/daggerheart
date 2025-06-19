import { DhHomebrew } from '../../data/settings/_module.mjs';
import DhSettingsActionView from './components/settingsActionsView.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DhHomebrewSettings extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor() {
        super({});

        this.settings = new DhHomebrew(game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Homebrew).toObject());
    }

    get title() {
        return game.i18n.localize('DAGGERHEART.Settings.Menu.Homebrew.Name');
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        id: 'daggerheart-homebrew-settings',
        classes: ['daggerheart', 'setting', 'dh-style'],
        position: { width: '600', height: 'auto' },
        actions: {
            addItem: this.addItem,
            editItem: this.editItem,
            removeItem: this.removeItem,
            resetMoves: this.resetMoves,
            save: this.save
        },
        form: { handler: this.updateData, submitOnChange: true }
    };

    static PARTS = {
        main: {
            template: 'systems/daggerheart/templates/settings/homebrew-settings.hbs'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.settingFields = this.settings;

        return context;
    }

    static async updateData(event, element, formData) {
        const updatedSettings = foundry.utils.expandObject(formData.object);

        await this.settings.updateSource({
            ...updatedSettings,
            traitArray: Object.values(updatedSettings.traitArray)
        });
        this.render();
    }

    static async addItem(_, target) {
        await this.settings.updateSource({
            [`restMoves.${target.dataset.type}.moves.${foundry.utils.randomID()}`]: {
                name: game.i18n.localize('DAGGERHEART.Settings.Homebrew.NewDowntimeMove'),
                img: 'icons/magic/life/cross-worn-green.webp',
                description: '',
                actions: []
            }
        });
        this.render();
    }

    static async editItem(_, target) {
        const move = this.settings.restMoves[target.dataset.type].moves[target.dataset.id];
        new Promise((resolve, reject) => {
            new DhSettingsActionView(
                resolve,
                reject,
                game.i18n.localize('DAGGERHEART.Settings.Homebrew.DowntimeMoves'),
                move.name,
                move.img,
                move.description,
                move.actions
            ).render(true);
        }).then(data => this.updateAction.bind(this)(data, target.dataset.type, target.dataset.id));
    }

    async updateAction(data, type, id) {
        await this.settings.updateSource({
            [`restMoves.${type}.moves.${id}`]: {
                name: data.name,
                img: data.img,
                description: data.description
            }
        });
        this.render();
    }

    static async removeItem(_, target) {
        await this.settings.updateSource({
            [`restMoves.${target.dataset.type}.moves.-=${target.dataset.id}`]: null
        });
        this.render();
    }

    static async resetMoves(_, target) {
        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: {
                title: game.i18n.format('DAGGERHEART.Settings.Homebrew.ResetMovesTitle', {
                    type: game.i18n.localize(
                        `DAGGERHEART.Downtime.${target.dataset.type === 'shortRest' ? 'ShortRest' : 'LongRest'}.title`
                    )
                })
            },
            content: game.i18n.localize('DAGGERHEART.Settings.Homebrew.ResetMovesText')
        });

        if (!confirmed) return;

        const fields = game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Homebrew).schema.fields;

        const removeUpdate = Object.keys(this.settings.restMoves[target.dataset.type].moves).reduce((acc, key) => {
            acc[`-=${key}`] = null;

            return acc;
        }, {});

        const updateBase =
            target.dataset.type === 'shortRest'
                ? fields.restMoves.fields.shortRest.fields
                : fields.restMoves.fields.longRest.fields;
        const update = {
            nrChoices: updateBase.nrChoices.initial,
            moves: Object.keys(updateBase.moves.initial).reduce((acc, key) => {
                const move = updateBase.moves.initial[key];
                acc[key] = {
                    ...move,
                    name: game.i18n.localize(move.name),
                    description: game.i18n.localize(move.description)
                };

                return acc;
            }, {})
        };

        await this.settings.updateSource({
            [`restMoves.${target.dataset.type}`]: {
                ...update,
                moves: {
                    ...removeUpdate,
                    ...update.moves
                }
            }
        });

        this.render();
    }

    static async save() {
        await game.settings.set(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.Homebrew, this.settings.toObject());
        this.close();
    }
}
