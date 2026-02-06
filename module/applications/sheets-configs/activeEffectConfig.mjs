import autocomplete from 'autocompleter';

export default class DhActiveEffectConfig extends foundry.applications.sheets.ActiveEffectConfig {
    constructor(options) {
        super(options);

        const ignoredActorKeys = ['config', 'DhEnvironment', 'DhParty'];
        this.changeChoices = Object.keys(game.system.api.models.actors).reduce((acc, key) => {
            if (ignoredActorKeys.includes(key)) return acc;

            const model = game.system.api.models.actors[key];
            const group = game.i18n.localize(model.metadata.label);
            const attributes = CONFIG.Token.documentClass.getTrackedAttributes(model.metadata.type);

            const getLabel = path => {
                const label = model.schema.getField(path)?.label;
                return label ? game.i18n.localize(label) : path;
            };

            const bars = attributes.bar.flatMap(x => {
                const joined = `${x.join('.')}.max`;
                const label =
                    joined === 'resources.hope.max'
                        ? 'DAGGERHEART.SETTINGS.Homebrew.FIELDS.maxHope.label'
                        : getLabel(joined);
                return { value: joined, label, group };
            });
            const values = attributes.value.flatMap(x => {
                const joined = x.join('.');
                return { value: joined, label: getLabel(joined), group };
            });

            acc.push(...bars, ...values);

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
        settings: { template: 'systems/daggerheart/templates/sheets/activeEffect/settings.hbs' },
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
                { id: 'settings', icon: 'fa-solid fa-bars', label: 'DAGGERHEART.GENERAL.Tabs.settings' },
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
                    const matchIndex = label.toLowerCase().indexOf(search.toLowerCase());

                    const beforeText = label.slice(0, matchIndex);
                    const matchText = label.slice(matchIndex, matchIndex + search.length);
                    const after = label.slice(matchIndex + search.length, label.length);

                    const element = document.createElement('li');
                    element.innerHTML =
                        `${beforeText}${matchText ? `<strong>${matchText}</strong>` : ''}${after}`.replaceAll(
                            ' ',
                            '&nbsp;'
                        );
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

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.systemFields = context.document.system.schema.fields;

        return context;
    }

    async _preparePartContext(partId, context) {
        const partContext = await super._preparePartContext(partId, context);
        switch (partId) {
            case 'details':
                const useGeneric = game.settings.get(
                    CONFIG.DH.id,
                    CONFIG.DH.SETTINGS.gameSettings.appearance
                ).showGenericStatusEffects;
                if (!useGeneric) {
                    partContext.statuses = Object.values(CONFIG.DH.GENERAL.conditions()).map(status => ({
                        value: status.id,
                        label: game.i18n.localize(status.name)
                    }));
                }
                break;
        }

        return partContext;
    }
}
