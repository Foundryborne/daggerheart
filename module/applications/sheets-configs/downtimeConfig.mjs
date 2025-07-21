import { actionsTypes } from '../../data/action/_module.mjs';
import DHActionConfig from './action-config.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DhSettingsActionView extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(move, moveId, settings, options) {
        super(options);

        this.move = move;

        this.actionsPath = `restMoves.shortRest.moves.${moveId}.actions`;
        this.settings = settings;
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
        footer: { template: 'systems/daggerheart/templates/settings/downtime-config/footer.hbs' }
    };

    /** @inheritdoc */
    static TABS = {
        primary: {
            tabs: [{ id: 'main' }, { id: 'actions' }],
            initial: 'main',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
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
        })) ?? {};
    }

    static async addItem() {
        const actionType = await this.selectActionType();
        const cls = actionsTypes[actionType?.type] ?? actionsTypes.attack,
            action = new cls(
                {
                    _id: foundry.utils.randomID(),
                    type: actionType.type,
                    name: game.i18n.localize(CONFIG.DH.ACTIONS.actionTypes[actionType.type].name),
                    img: 'icons/magic/life/cross-worn-green.webp',
                    actionType: 'action',
                    systemPath: this.actionsPath
                },
                {
                    parent: this.settings
                }
            );

        this.move.actions.push(action);
        await this.settings.updateSource({ [this.actionsPath]: this.move.actions });

        this.render();
    }

    static async editItem(_, target) {
        const editIndex = Number(target.dataset.id);
        const action = this.move.actions.find((_, index) => index === editIndex);
        await new DHActionConfig(action, async updatedMove => {
            this.move.actions[editIndex] = updatedMove;
            await this.settings.updateSource({ [this.actionsPath]: this.move.actions });
            this.render();
        }).render(true);
    }

    static async removeItem(_, target) {
        this.move.actions = this.move.actions.filter((_, index) => index !== Number(target.dataset.id));
        await this.settings.updateSource({ [this.actionsPath]: this.move.actions });

        this.render();
    }

    static resetMoves() {}

    /** @override */
    _onClose(options = {}) {
        if (!options.submitted) this.move = null;
    }

    static async configure(move, moveId, settings, options = {}) {
        return new Promise(resolve => {
            const app = new this(move, moveId, settings, options);
            app.addEventListener('close', () => resolve(app.move), { once: true });
            app.render({ force: true });
        });
    }
}
