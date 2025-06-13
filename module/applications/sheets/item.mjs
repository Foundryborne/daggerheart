import DhpApplicationMixin from './daggerheart-sheet.mjs';
import DHActionConfig from '../config/Action.mjs';
import { actionsTypes } from '../../data/_module.mjs';

export default function DHItemMixin(Base) {
    return class DHItemSheetV2 extends DhpApplicationMixin(Base) {
        constructor(options = {}) {
            super(options);
        }

        static DEFAULT_OPTIONS = {
            tag: 'form',
            classes: ['daggerheart', 'sheet', 'item', 'dh-style'],
            position: { width: 600 },
            form: {
                handler: this.updateForm,
                submitOnChange: true,
                closeOnSubmit: false
            },
            actions: {
                addAction: this.addAction,
                editAction: this.editAction,
                removeAction: this.removeAction
            }
        };

        static TABS = {
            description: {
                active: true,
                cssClass: '',
                group: 'primary',
                id: 'description',
                icon: null,
                label: 'DAGGERHEART.Sheets.Feature.Tabs.Description'
            },
            actions: {
                active: false,
                cssClass: '',
                group: 'primary',
                id: 'actions',
                icon: null,
                label: 'DAGGERHEART.Sheets.Feature.Tabs.Actions'
            },
            settings: {
                active: false,
                cssClass: '',
                group: 'primary',
                id: 'settings',
                icon: null,
                label: 'DAGGERHEART.Sheets.Feature.Tabs.Settings'
            }
        };

        async _prepareContext(_options) {
            const context = await super._prepareContext(_options);
            context.document = this.document;
            context.config = CONFIG.daggerheart;
            context.tabs = super._getTabs(this.constructor.TABS);

            return context;
        }

        static async updateForm(event, _, formData) {
            await this.document.update(formData.object);
            this.render();
        }

        static async selectActionType() {
            const content = await foundry.applications.handlebars.renderTemplate(
                    'systems/daggerheart/templates/views/actionType.hbs',
                    { types: SYSTEM.ACTIONS.actionTypes }
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
                    // if (!data.name?.trim()) data.name = game.i18n.localize(SYSTEM.ACTIONS.actionTypes[data.type].name);
                    return data;
                },
                rejectClose: false
            });
        }

        static async addAction() {
            const actionType = await DHItemSheetV2.selectActionType(),
                actionIndexes = this.document.system.actions.map(x => x._id.split('-')[2]).sort((a, b) => a - b);
            try {
                const cls = actionsTypes[actionType?.type] ?? actionsTypes.attack,
                    action = new cls(
                        {
                            // id: `${this.document.id}-Action-${actionIndexes.length > 0 ? actionIndexes[0] + 1 : 1}`
                            _id: foundry.utils.randomID(),
                            type: actionType.type,
                            name: game.i18n.localize(SYSTEM.ACTIONS.actionTypes[actionType.type].name),
                            ...cls.getSourceConfig(this.document)
                        },
                        {
                            parent: this.document
                        }
                    );
                await this.document.update({ 'system.actions': [...this.document.system.actions, action] });
                await new DHActionConfig(this.document.system.actions[this.document.system.actions.length - 1]).render(
                    true
                );
            } catch (error) {
                console.log(error);
            }
        }

        static async editAction(_, button) {
            const action = this.document.system.actions[button.dataset.index];
            await new DHActionConfig(action).render(true);
        }

        static async removeAction(event, button) {
            event.stopPropagation();
            await this.document.update({
                'system.actions': this.document.system.actions.filter(
                    (_, index) => index !== Number.parseInt(button.dataset.index)
                )
            });
        }
    };
}
