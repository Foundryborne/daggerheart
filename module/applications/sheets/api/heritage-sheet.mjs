import autocomplete from 'autocompleter';
import DHBaseItemSheet from './base-item.mjs';

export default class DHHeritageSheet extends DHBaseItemSheet {
    /**@inheritdoc */
    static DEFAULT_OPTIONS = {
        position: { width: 450, height: 700 }
    };

    /**@override */
    static PARTS = {
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        description: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-description.hbs' },
        effects: {
            template: 'systems/daggerheart/templates/sheets/global/tabs/tab-effects.hbs',
            scrollable: ['.effects']
        }
    };

    /** @override*/
    static TABS = {
        primary: {
            tabs: [{ id: 'description' }, { id: 'features' }, { id: 'effects' }],
            initial: 'description',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    /** @inheritdoc */
    _attachPartListeners(partId, htmlElement, options) {
        super._attachPartListeners(partId, htmlElement, options);

        const loreRefElement = htmlElement.querySelector('input[name="system.loreReference"]');
        const choiceKeys = Object.keys(CONFIG.DH.lore[this.item.type] ?? {});
        if (loreRefElement && choiceKeys) {
            const choices = choiceKeys.map(k => ({ value: k, label: k }));
            autocomplete({
                input: loreRefElement,
                fetch: function (text, update) {
                    if (!text) {
                        update(choices);
                    } else {
                        text = text.toLowerCase();
                        update(choices.filter(n => n.label.toLowerCase().includes(text)));
                    }
                },
                onSelect: item => {
                    this.item.update({ 'system.loreReference': String(item.value) });
                },
                click: e => e.fetch(),
                customize: function (_input, _inputRect, container) {
                    container.style.zIndex = foundry.applications.api.ApplicationV2._maxZ;
                },
                minLength: 0
            })
        }
    }
}
