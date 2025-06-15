import { actionsTypes } from '../../../data/_module.mjs';
import DHActionConfig from '../../config/Action.mjs';
import DHItemMixin from '../item.mjs';

export default function DHHeritageMixin(Base) {
    return class DHHeritageSheetV2 extends DHItemMixin(Base) {
        static DEFAULT_OPTIONS = {
            tag: 'form',
            position: { width: 450, height: 700 },
            actions: {
                addAction: this.addAction,
                editAction: this.editAction,
                removeAction: this.removeAction,
                addEffect: this.addEffect,
                editEffect: this.editEffect,
                removeEffect: this.removeEffect
            },
            form: {
                handler: this.updateForm,
                submitOnChange: true,
                closeOnSubmit: false
            }
        };

        static PARTS = {
            tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
            description: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-description.hbs' },
            actions: {
                template: 'systems/daggerheart/templates/sheets/global/tabs/tab-actions.hbs',
                scrollable: ['.actions']
            },
            effects: {
                template: 'systems/daggerheart/templates/sheets/global/tabs/tab-effects.hbs',
                scrollable: ['.effects']
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
            effects: {
                active: false,
                cssClass: '',
                group: 'primary',
                id: 'effects',
                icon: null,
                label: 'DAGGERHEART.Sheets.Feature.Tabs.Effects'
            }
        };

        async _prepareContext(_options) {
            const context = await super._prepareContext(_options);
            context.document = this.document;
            context.tabs = super._getTabs(this.constructor.TABS);

            return context;
        }

        static async updateForm(event, _, formData) {
            await this.document.update(formData.object);
            this.render();
        }

        async selectActionType() {
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
                    return data;
                },
                rejectClose: false
            });
        }

        static async addAction() {
            const actionType = await this.selectActionType();
            const cls = actionsTypes[actionType?.type] ?? actionsTypes.attack,
                action = new cls(
                    {
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

        static async addEffect() {
            await this.document.createEmbeddedDocuments('ActiveEffect', [
                { name: game.i18n.localize('DAGGERHEART.Feature.NewEffect') }
            ]);
        }

        static async editEffect(_, target) {
            const effect = this.document.effects.get(target.dataset.effect);
            effect.sheet.render(true);
        }

        static async removeEffect(_, target) {
            await this.document.effects.get(target.dataset.effect).delete();
        }
    };
}
