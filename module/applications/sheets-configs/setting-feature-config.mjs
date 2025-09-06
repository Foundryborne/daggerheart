import { actionsTypes } from '../../data/action/_module.mjs';
import DHActionConfig from './action-config.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class SettingFeatureConfig extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(move, movePath, settings, optionalParts, options) {
        super(options);

        this.move = move;

        this.movePath = movePath;
        this.actionsPath = `${movePath}.actions`;
        this.settings = settings;

        const { hasIcon, hasEffects } = optionalParts;
        this.hasIcon = hasIcon;
        this.hasEffects = hasEffects;
    }

    get title() {
        return game.i18n.localize('DAGGERHEART.SETTINGS.Homebrew.downtimeMoves');
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'setting', 'dh-style'],
        position: { width: 440, height: 'auto' },
        window: {
            icon: 'fa-solid fa-gears'
        },
        actions: {
            editImage: this.onEditImage,
            addItem: this.addItem,
            editItem: this.editItem,
            removeItem: this.removeItem,
            addEffect: this.addEffect,
            resetMoves: this.resetMoves,
            saveForm: this.saveForm
        },
        form: { handler: this.updateData, submitOnChange: true, closeOnSubmit: false }
    };

    static PARTS = {
        header: { template: 'systems/daggerheart/templates/settings/downtime-config/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        main: { template: 'systems/daggerheart/templates/settings/downtime-config/main.hbs' },
        actions: { template: 'systems/daggerheart/templates/settings/downtime-config/actions.hbs' },
        effects: { template: 'systems/daggerheart/templates/settings/downtime-config/effects.hbs' },
        footer: { template: 'systems/daggerheart/templates/settings/downtime-config/footer.hbs' }
    };

    /** @inheritdoc */
    static TABS = {
        primary: {
            tabs: [{ id: 'main' }, { id: 'actions' }, { id: 'effects' }],
            initial: 'main',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.tabs = this._filterTabs(context.tabs);
        context.hasIcon = this.hasIcon;
        context.hasEffects = this.hasEffects;
        context.move = this.move;
        context.move.enrichedDescription = await foundry.applications.ux.TextEditor.enrichHTML(
            context.move.description
        );

        return context;
    }

    static async updateData(event, element, formData) {
        const data = foundry.utils.expandObject(formData.object);
        foundry.utils.mergeObject(this.move, data);

        this.render();
    }

    static async saveForm() {
        this.close({ submitted: true });
    }

    static onEditImage() {
        const fp = new foundry.applications.apps.FilePicker.implementation({
            current: this.img,
            type: 'image',
            callback: async path => {
                this.move.img = path;
                this.render();
            },
            top: this.position.top + 40,
            left: this.position.left + 10
        });
        return fp.browse();
    }

    async selectActionType() {
        return (
            (await foundry.applications.api.DialogV2.input({
                window: { title: game.i18n.localize('DAGGERHEART.CONFIG.SelectAction.selectType') },
                content: await foundry.applications.handlebars.renderTemplate(
                    'systems/daggerheart/templates/actionTypes/actionType.hbs',
                    { types: CONFIG.DH.ACTIONS.actionTypes }
                ),
                ok: {
                    label: game.i18n.format('DOCUMENT.Create', {
                        type: game.i18n.localize('DAGGERHEART.GENERAL.Action.single')
                    })
                }
            })) ?? {}
        );
    }

    static async addItem() {
        const { type: actionType } = await this.selectActionType();
        if (!actionType) return;

        const cls = actionsTypes[actionType] ?? actionsTypes.attack,
            action = new cls(
                {
                    type: actionType,
                    name: game.i18n.localize(CONFIG.DH.ACTIONS.actionTypes[actionType].name),
                    img: 'icons/magic/life/cross-worn-green.webp',
                    actionType: 'action',
                    systemPath: this.actionsPath
                },
                {
                    parent: this.settings
                }
            );

        await this.settings.updateSource({ [`${this.actionsPath}.${action.id}`]: action });
        this.move = foundry.utils.getProperty(this.settings, this.movePath);

        this.render();
    }

    static async editItem(_, target) {
        const { type, id } = target.dataset;
        if (type === 'effect') {
            const effectIndex = this.move.effects.findIndex(x => x.id === id);
            const effect = this.move.effects[effectIndex];
            const updatedEffect =
                await game.system.api.applications.sheetConfigs.SettingActiveEffectConfig.configure(effect);
            if (!updatedEffect) return;

            await this.settings.updateSource({
                [`${this.movePath}.effects`]: this.move.effects.reduce((acc, effect, index) => {
                    acc.push(index === effectIndex ? { ...updatedEffect, id: effect.id } : effect);
                    return acc;
                }, [])
            });
            this.move = foundry.utils.getProperty(this.settings, this.movePath);
            this.render();
        } else {
            const action = this.move.actions.get(id);
            await new DHActionConfig(action, async updatedMove => {
                await this.settings.updateSource({ [`${this.actionsPath}.${id}`]: updatedMove });
                this.move = foundry.utils.getProperty(this.settings, this.movePath);
                this.render();
            }).render(true);
        }
    }

    static async removeItem(_, target) {
        await this.settings.updateSource({ [`${this.actionsPath}.-=${target.dataset.id}`]: null });
        this.move = foundry.utils.getProperty(this.settings, this.movePath);
        this.render();
    }

    static async addEffect(_, target) {
        const currentEffects = foundry.utils.getProperty(this.settings, `${this.movePath}.effects`);
        await this.settings.updateSource({
            [`${this.movePath}.effects`]: [
                ...currentEffects,
                game.system.api.data.activeEffects.BaseEffect.getDefaultObject()
            ]
        });

        this.move = foundry.utils.getProperty(this.settings, this.movePath);
        this.render();
    }

    static resetMoves() {}

    _filterTabs(tabs) {
        return this.hasEffects
            ? tabs
            : Object.keys(tabs).reduce((acc, key) => {
                  if (key !== 'effects') acc[key] = tabs[key];
                  return acc;
              }, {});
    }

    /** @override */
    _onClose(options = {}) {
        if (!options.submitted) this.move = null;
    }

    static async configure(move, movePath, settings, optionalParts, options = {}) {
        return new Promise(resolve => {
            const app = new this(move, movePath, settings, optionalParts, options);
            app.addEventListener('close', () => resolve(app.move), { once: true });
            app.render({ force: true });
        });
    }
}
