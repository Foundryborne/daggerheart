import DaggerheartSheet from './daggerheart-sheet.mjs';

const { ActorSheetV2 } = foundry.applications.sheets;
export default class DhpEnvironment extends DaggerheartSheet(ActorSheetV2) {
    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'sheet', 'actor', 'dh-style', 'environment'],
        position: {
            width: 450,
            height: 1000
        },
        actions: {
            addAdversary: this.addAdversary,
            addFeature: this.addFeature,
            deleteProperty: this.deleteProperty,
            viewAdversary: this.viewAdversary
        },
        form: {
            handler: this._updateForm,
            submitOnChange: true,
            closeOnSubmit: false
        },
        dragDrop: [{ dragSelector: null, dropSelector: '.adversary-container' }]
    };

    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/actors/environment/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        main: { template: 'systems/daggerheart/templates/sheets/actors/environment/main.hbs' },
        information: { template: 'systems/daggerheart/templates/sheets/actors/environment/information.hbs' }
    };

    static TABS = {
        main: {
            active: true,
            cssClass: '',
            group: 'primary',
            id: 'main',
            icon: null,
            label: 'DAGGERHEART.Sheets.Environment.Tabs.Main'
        },
        information: {
            active: false,
            cssClass: '',
            group: 'primary',
            id: 'information',
            icon: null,
            label: 'DAGGERHEART.Sheets.Environment.Tabs.Information'
        }
    };

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.document = this.document;
        context.tabs = super._getTabs(this.constructor.TABS);
        context.getEffectDetails = this.getEffectDetails.bind(this);

        return context;
    }

    static async _updateForm(event, _, formData) {
        await this.document.update(formData.object);
        this.render();
    }

    getEffectDetails(id) {
        return {};
    }

    static async addAdversary() {
        await this.document.update({
            [`system.potentialAdversaries.${foundry.utils.randomID()}.label`]: game.i18n.localize(
                'DAGGERHEART.Sheets.Environment.newAdversary'
            )
        });
        this.render();
    }

    static async addFeature() {
        ui.notifications.error('Not Implemented yet. Awaiting datamodel rework');
    }

    static async deleteProperty(_, target) {
        await this.document.update({ [`${target.dataset.path}.-=${target.id}`]: null });
        this.render();
    }

    static async viewAdversary(_, button) {
        const adversary = foundry.utils.getProperty(
            this.document.system.potentialAdversaries,
            `${button.dataset.potentialAdversary}.adversaries.${button.dataset.adversary}`
        );
        adversary.sheet.render(true);
    }

    async _onDrop(event) {
        const data = TextEditor.getDragEventData(event);
        const item = await fromUuid(data.uuid);
        if (item.type === 'adversary') {
            const target = event.target.closest('.adversary-container');
            const path = `system.potentialAdversaries.${target.dataset.potentialAdversary}.adversaries.${item.id}`;
            await this.document.update({
                [path]: item.uuid
            });
        }
    }
}
