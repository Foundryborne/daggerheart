import autocomplete from 'autocompleter';

export default class DhActiveEffectConfig extends foundry.applications.sheets.ActiveEffectConfig {
    constructor(options) {
        super(options);

        const ignoredActorKeys = ['config', 'DhEnvironment'];
        this.changeChoices = Object.keys(game.system.api.models.actors).reduce((acc, key) => {
            if (!ignoredActorKeys.includes(key)) {
                const model = game.system.api.models.actors[key];
                const attributes = CONFIG.Token.documentClass.getTrackedAttributes(model);
                const group = game.i18n.localize(model.metadata.label);
                const choices = CONFIG.Token.documentClass
                    .getTrackedAttributeChoices(attributes, model)
                    .map(x => ({ ...x, group: group }));
                acc.push(...choices);
            }
            return acc;
        }, []);
    }

    static DEFAULT_OPTIONS = {
        classes: ['daggerheart', 'sheet', 'dh-style']
    };

    static PARTS = {
        header: { template: 'systems/daggerheart/templates/sheets/activeEffect/header.hbs' },
        tabs: { template: 'templates/generic/tab-navigation.hbs' },
        details: { template: 'systems/daggerheart/templates/sheets/activeEffect/details.hbs', scrollable: [''] },
        duration: { template: 'systems/daggerheart/templates/sheets/activeEffect/duration.hbs' },
        changes: {
            template: 'systems/daggerheart/templates/sheets/activeEffect/changes.hbs',
            scrollable: ['ol[data-changes]']
        },
        footer: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-form-footer.hbs' }
    };

    static TABS = {
        sheet: {
            tabs: [
                { id: 'details', icon: 'fa-solid fa-book' },
                { id: 'duration', icon: 'fa-solid fa-clock' },
                { id: 'changes', icon: 'fa-solid fa-gears' }
            ],
            initial: 'details',
            labelPrefix: 'EFFECT.TABS'
        }
    };

    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);
        const changeChoices = this.changeChoices;

        htmlElement.querySelectorAll('.effect-change-input').forEach(element => {
            autocomplete({
                input: element,
                fetch: function (text, update) {
                    if (!text) {
                        update(changeChoices);
                    } else {
                        text = text.toLowerCase();
                        var suggestions = changeChoices.filter(n => n.label.toLowerCase().includes(text));
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
                    element.value = `system.${item.value}`;
                },
                click: e => e.fetch(),
                customize: function (_input, _inputRect, container) {
                    container.style.zIndex = foundry.applications.api.ApplicationV2._maxZ;
                },
                minLength: 0
            });
        });
    }

    async _preparePartContext(partId, context) {
        const partContext = await super._preparePartContext(partId, context);
        switch (partId) {
            case 'changes':
                break;
        }

        return partContext;
    }
}
