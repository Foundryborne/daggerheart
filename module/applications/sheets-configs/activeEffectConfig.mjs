import autocomplete from 'autocompleter';

export default class DhActiveEffectConfig extends foundry.applications.sheets.ActiveEffectConfig {
    constructor(options) {
        super(options);

        const ignoredActorKeys = ['config', 'DhEnvironment'];
        const actorAttributes = Object.keys(game.system.api.models.actors).reduce((acc, key) => {
            if (!ignoredActorKeys.includes(key)) {
                const model = game.system.api.models.actors[key];
                const attributes = CONFIG.Token.documentClass.getTrackedAttributes(model);
                acc[game.i18n.localize(model.metadata.label)] = CONFIG.Token.documentClass.getTrackedAttributeChoices(
                    attributes,
                    model
                );
            }
            return acc;
        }, {});
        console.log(actorAttributes);

        // const allowedItemKeys = ['DHArmor'];
        // const itemAttributes = Object.keys(game.system.api.models.items).reduce((acc, key) => {
        //     if(allowedItemKeys.includes(key)) {
        //         const model = game.system.api.models.items[key];
        //         acc[game.i18n.localize(model.metadata.label)] = CONFIG.Token.documentClass.getTrackedAttributes(model);
        //     }
        //     return acc;
        // }, {});

        // this.selectChoices = [
        //     ...Object.keys(actorAttributes).flatMap(name => {
        //         const attribute = actorAttributes[name];
        //         return { group: name, label: attribute, value: attribute };
        //     }),
        //     ...Object.keys(itemAttributes).flatMap(name => {
        //         const attribute = itemAttributes[name];
        //         return { group: name, label: attribute, value: attribute };
        //     })
        // ];
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
        const selectChoices = this.selectChoices;

        htmlElement.querySelectorAll('.effect-change-input').forEach(element => {
            autocomplete({
                input: element,
                fetch: function (text, update) {
                    if (!text) {
                        update(selectChoices);
                    } else {
                        text = text.toLowerCase();
                        var suggestions = selectChoices.filter(n => n.label.toLowerCase().includes(text));
                        update(suggestions);
                    }
                },
                render: function (item, search) {
                    const label = game.i18n.localize(item.label);
                    const matchIndex = label.toLowerCase().indexOf(search);

                    const base = document.createElement('div');
                    base.textContent = label.slice(0, matchIndex);

                    const matchText = document.createElement('div');
                    matchText.textContent = label.slice(matchIndex, matchIndex + search.length);
                    matchText.classList.add('matched');

                    const after = document.createElement('div');
                    after.textContent = label.slice(matchIndex + search.length, label.length);

                    base.insertAdjacentElement('beforeend', matchText);
                    base.insertAdjacentElement('beforeend', after);
                    return base;
                },
                renderGroup: function (label) {
                    const itemElement = document.createElement('div');
                    itemElement.textContent = game.i18n.localize(label);
                    return itemElement;
                },
                onSelect: function (item) {
                    element.value = item.value;
                },
                click: e => e.fetch(),
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
