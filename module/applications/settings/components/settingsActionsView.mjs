import { actionsTypes } from '../../../data/action/_module.mjs';
import DHActionConfig from '../../sheets-configs/action-config.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DhSettingsActionView extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(resolve, reject, title, name, icon, img, description, actions) {
        super({});

        this.resolve = resolve;
        this.reject = reject;
        this.viewTitle = title;
        this.name = name;
        this.icon = icon;
        this.img = img;
        this.description = description;
        this.actions = actions;
    }

    get title() {
        return this.viewTitle;
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'setting', 'dh-style'],
        position: { width: 440, height: 'auto' },
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
        header: { template: 'systems/daggerheart/templates/settings/components/action-view-header.hbs' },
        main: {
            template: 'systems/daggerheart/templates/settings/components/action-view.hbs'
        },
        footer: { template: 'systems/daggerheart/templates/settings/components/action-view-footer.hbs' }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.name = this.name;
        context.icon = this.icon;
        context.img = this.img;
        context.description = this.description;
        context.enrichedDescription = await foundry.applications.ux.TextEditor.enrichHTML(context.description);
        context.actions = this.actions;

        return context;
    }

    static async updateData(event, element, formData) {
        const { name, icon, description } = foundry.utils.expandObject(formData.object);
        this.name = name;
        this.icon = icon;
        this.description = description;

        this.render();
    }

    static async saveForm(event) {
        this.resolve({
            name: this.name,
            icon: this.icon,
            img: this.img,
            description: this.description,
            actions: this.actions
        });
        this.close(true);
    }

    static close(fromSave) {
        if (!fromSave) {
            this.reject();
        }

        super.close();
    }

    static onEditImage() {
        const fp = new foundry.applications.apps.FilePicker.implementation({
            current: this.img,
            type: 'image',
            callback: async path => {
                this.img = path;
                this.render();
            },
            top: this.position.top + 40,
            left: this.position.left + 10
        });
        return fp.browse();
    }

    async selectActionType() {
        const content = await foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/actionTypes/actionType.hbs',
                { types: CONFIG.DH.ACTIONS.actionTypes }
            ),
            title = 'Select Action Type',
            type = 'form',
            data = {};
        return Dialog.prompt({
            title,
            label: title,
            content,
            type,
            callback: html => {
                const form = html[0].querySelector('form'),
                    fd = new foundry.applications.ux.FormDataExtended(form);
                foundry.utils.mergeObject(data, fd.object, { inplace: true });
                return data;
            },
            rejectClose: false
        });
    }

    static async addItem() {
        const actionType = await this.selectActionType();
        const cls = actionsTypes[actionType?.type] ?? actionsTypes.attack,
            action = new cls({
                _id: foundry.utils.randomID(),
                type: actionType.type,
                name: game.i18n.localize(CONFIG.DH.ACTIONS.actionTypes[actionType.type].name),
                ...cls.getSourceConfig(this.document)
            });

        this.actions.push(action);
        this.render();
    }

    static async editItem(_, button) {
        await new DHActionConfig(this.actions[button.dataset.id]).render(true);
    }

    static removeItem(event, button) {
        this.actions = this.actions.filter((_, index) => index !== Number.parseInt(button.dataset.id));
        this.render();
    }

    static resetMoves() {}
}
