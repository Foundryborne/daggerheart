import autocomplete from 'autocompleter';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class AttriubtionDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(item) {
        super({});

        this.item = item;
        this.sources = Object.keys(CONFIG.DH.GENERAL.attributionSources).flatMap(groupKey => {
            const group = CONFIG.DH.GENERAL.attributionSources[groupKey];
            return group.values.map(x => ({ group: group.label, ...x }));
        });
    }

    get title() {
        return game.i18n.localize('DAGGERHEART.APPLICATIONS.Attribution.title');
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['daggerheart', 'dh-style', 'dialog', 'views', 'attribution'],
        position: { width: 'auto', height: 'auto' },
        window: { icon: 'fa-solid fa-signature' },
        form: { handler: this.updateData, submitOnChange: false, closeOnSubmit: true }
    };

    static PARTS = {
        main: { template: 'systems/daggerheart/templates/dialogs/attribution.hbs' }
    };

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);
        const sources = this.sources;

        htmlElement.querySelectorAll('.attribution-input').forEach(element => {
            autocomplete({
                input: element,
                fetch: function (text, update) {
                    if (!text) {
                        update(sources);
                    } else {
                        text = text.toLowerCase();
                        var suggestions = sources.filter(n => n.label.toLowerCase().includes(text));
                        update(suggestions);
                    }
                },
                render: function (item, search) {
                    const label = game.i18n.localize(item.label);
                    const matchIndex = label.toLowerCase().indexOf(search);

                    const beforeText = label.slice(0, matchIndex);
                    const matchText = label.slice(matchIndex, matchIndex + search.length);
                    const after = label.slice(matchIndex + search.length, label.length);

                    const element = document.createElement('li');
                    element.innerHTML = `${beforeText}${matchText ? `<strong>${matchText}</strong>` : ''}${after}`;
                    if (item.hint) {
                        element.dataset.tooltip = game.i18n.localize(item.hint);
                    }

                    return element;
                },
                renderGroup: function (label) {
                    const itemElement = document.createElement('div');
                    itemElement.textContent = game.i18n.localize(label);
                    return itemElement;
                },
                onSelect: function (item) {
                    element.value = item.label;
                },
                click: e => e.fetch(),
                customize: function (_input, _inputRect, container) {
                    container.style.zIndex = foundry.applications.api.ApplicationV2._maxZ;
                },
                minLength: 0
            });
        });
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.item = this.item;
        context.data = this.item.system.attribution;

        return context;
    }

    static async updateData(_event, _element, formData) {
        await this.item.update({ 'system.attribution': formData.object });
        this.item.sheet.refreshFrame();
    }
}
