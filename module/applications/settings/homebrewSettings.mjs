import { DhHomebrew } from '../../data/settings/_module.mjs';
import DhSettingsActionView from './components/settingsActionsView.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DhHomebrewSettings extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor() {
        super({});

        this.settings = new DhHomebrew(
            game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).toObject()
        );
    }

    get title() {
        return game.i18n.localize('DAGGERHEART.SETTINGS.Menu.homebrew.name');
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
            save: this.save,
            reset: this.reset
        },
        form: { handler: this.updateData, submitOnChange: true }
    };

    static PARTS = {
        main: {
            template: 'systems/daggerheart/templates/settings/homebrew-settings.hbs',
            scrollable: ['']
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
                name: game.i18n.localize('DAGGERHEART.SETTINGS.Homebrew.newDowntimeMove'),
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
                game.i18n.localize('DAGGERHEART.SETTINGS.Homebrew.downtimeMoves'),
                move.name,
                move.icon,
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
                icon: data.icon,
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
                title: game.i18n.format('DAGGERHEART.SETTINGS.Homebrew.resetMovesTitle', {
                    type: game.i18n.localize(
                        `DAGGERHEART.APPLICATIONS.Downtime.${target.dataset.type === 'shortRest' ? 'shortRest' : 'longRest'}.title`
                    )
                })
            },
            content: game.i18n.localize('DAGGERHEART.SETTINGS.Homebrew.resetMovesText')
        });

        if (!confirmed) return;

        const fields = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).schema.fields;

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
        await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew, this.settings.toObject());
        this.close();
    }

    static async reset() {
        const resetSettings = new DhHomebrew();
        let localizedSettings = this.localizeObject(resetSettings);
        this.settings.updateSource(localizedSettings);
        this.render();
    }

    localizeObject(obj) {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                if (typeof value === 'object' && value !== null) {
                    obj[key] = this.localizeObject(value);
                } else {
                    if (typeof value === 'string' && value.startsWith('DAGGERHEART.')) {
                        obj[key] = game.i18n.localize(value);
                    }
                }
            }
        }
        return obj;
    }
}
