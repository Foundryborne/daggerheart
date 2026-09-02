import { LevelOptionType } from '../../data/levelTier.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class LevelupOptionsDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(item) {
        super({});

        this.item = item;
        this.selectedOption = null;
    }

    get title() {
        return game.i18n.format('DAGGERHEART.APPLICATIONS.LevelupOptionsDialog.title', { name: this.item.name });
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'dh-style', 'dialog', 'views', 'levelup-options-dialog'],
        position: { width: 480, height: 'auto' },
        window: { icon: 'fa-solid fa-angles-up fa-fw' },
        actions: {
            addTierOption: LevelupOptionsDialog.#addTierOption,
            removeTierOption: LevelupOptionsDialog.#removeTierOption
        },
        form: { handler: this.updateData, submitOnChange: true, closeOnSubmit: false }
    };

    static PARTS = {
        header: { template: 'systems/daggerheart/templates/dialogs/levelupOptionsDialog/header.hbs' },
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        tiers: { template: 'systems/daggerheart/templates/dialogs/levelupOptionsDialog/tiers.hbs' }
    };

    /** @inheritdoc */
    static TABS = {
        primary: {
            tabs: [
                { id: 'tier2', label: 'DAGGERHEART.GENERAL.Tiers.2', tier: 2 },
                { id: 'tier3', label: 'DAGGERHEART.GENERAL.Tiers.3', tier: 3 },
                { id: 'tier4', label: 'DAGGERHEART.GENERAL.Tiers.4', tier: 4 }
            ],
            initial: 'tier2'
        }
    };

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        for (const element of htmlElement.querySelectorAll('.option-type-select'))
            element.addEventListener('change', this.updateSelectedOption.bind(this));
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.fields = this.item.system.schema.fields.levelupOptionTiers.element.element.fields;
        context.item = this.item;
        context.levelupOptionTiers = Object.keys(this.item.system.levelupOptionTiers).reduce((acc, key) => {
            const tier = this.item.system.levelupOptionTiers[key];
            acc[key] = Object.keys(tier).reduce((acc, key) => {
                const option = tier[key];
                acc[key] = {
                    ...option,
                    typeData: option.type ? LevelOptionType[option.type] : null
                };

                return acc;
            }, {});

            return acc;
        }, {});

        context.optionTypes = LevelOptionType;
        context.selectedOption = this.selectedOption;

        return context;
    }

    static async updateData(_event, _element, formData) {
        const data = foundry.utils.expandObject(formData.object);
        await this.item.update(data);

        this.render();
    }

    updateSelectedOption(event) {
        this.selectedOption = event.target.value;
        this.render();
    }

    static async #addTierOption(_event, button) {
        const { tier } = button.dataset;
        await this.item.update({
            [`system.levelupOptionTiers.${tier}.${foundry.utils.randomID()}`]: {
                label: LevelOptionType[this.selectedOption].label,
                type: this.selectedOption
            }
        });

        this.selectedOption = null;
        this.render();
    }

    static async #removeTierOption(_event, button) {
        const { tier, key } = button.dataset;

        await this.item.update({ [`system.levelupOptionTiers.${tier}.${key}`]: _del });
        this.render();
    }
}
