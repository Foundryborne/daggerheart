import autocomplete from 'autocompleter';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class SettingActiveEffectConfig extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(effect) {
        super({});

        this.effect = foundry.utils.deepClone(effect);
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
        classes: ['daggerheart', 'sheet', 'dh-style', 'active-effect-config'],
        tag: 'form',
        position: {
            width: 560
        },
        form: {
            submitOnChange: false,
            closeOnSubmit: false,
            handler: SettingActiveEffectConfig.#onSubmit
        },
        actions: {
            editImage: SettingActiveEffectConfig.#editImage,
            addChange: SettingActiveEffectConfig.#addChange,
            deleteChange: SettingActiveEffectConfig.#deleteChange
        }
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

    /**@inheritdoc */
    async _onFirstRender(context, options) {
        await super._onFirstRender(context, options);
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.source = this.effect;
        context.fields = game.system.api.documents.DhActiveEffect.schema.fields;
        context.systemFields = game.system.api.data.activeEffects.BaseEffect._schema.fields;

        return context;
    }

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
        if (partId in context.tabs) context.tab = context.tabs[partId];
        switch (partId) {
            case 'details':
                context.isActorEffect = false;
                context.isItemEffect = true;
                const useGeneric = game.settings.get(
                    CONFIG.DH.id,
                    CONFIG.DH.SETTINGS.gameSettings.appearance
                ).showGenericStatusEffects;
                if (!useGeneric) {
                    context.statuses = Object.values(CONFIG.DH.GENERAL.conditions).map(status => ({
                        value: status.id,
                        label: game.i18n.localize(status.name)
                    }));
                }
                break;
            case 'changes':
                context.modes = Object.entries(CONST.ACTIVE_EFFECT_MODES).reduce((modes, [key, value]) => {
                    modes[value] = game.i18n.localize(`EFFECT.MODE_${key}`);
                    return modes;
                }, {});

                context.priorities = ActiveEffectConfig.DEFAULT_PRIORITIES;
                break;
        }

        return context;
    }

    static async #onSubmit(event, form, formData) {
        this.data = foundry.utils.expandObject(formData.object);
        this.close();
    }

    /**
     * Edit a Document image.
     * @this {DocumentSheetV2}
     * @type {ApplicationClickAction}
     */
    static async #editImage(_event, target) {
        if (target.nodeName !== 'IMG') {
            throw new Error('The editImage action is available only for IMG elements.');
        }

        const attr = target.dataset.edit;
        const current = foundry.utils.getProperty(this.effect, attr);
        const fp = new FilePicker.implementation({
            current,
            type: 'image',
            callback: path => (target.src = path),
            position: {
                top: this.position.top + 40,
                left: this.position.left + 10
            }
        });

        await fp.browse();
    }

    /**
     * Add a new change to the effect's changes array.
     * @this {ActiveEffectConfig}
     * @type {ApplicationClickAction}
     */
    static async #addChange() {
        const submitData = foundry.utils.expandObject(new FormDataExtended(this.form).object);
        const changes = Object.values(submitData.changes ?? {});
        changes.push({});

        this.effect.changes = changes;
        this.render();
    }

    /**
     * Delete a change from the effect's changes array.
     * @this {ActiveEffectConfig}
     * @type {ApplicationClickAction}
     */
    static async #deleteChange(event) {
        const submitData = foundry.utils.expandObject(new FormDataExtended(this.form).object);
        const changes = Object.values(submitData.changes);
        const row = event.target.closest('li');
        const index = Number(row.dataset.index) || 0;
        changes.splice(index, 1);

        this.effect.changes = changes;
        this.render();
    }

    static async configure(effect, options = {}) {
        return new Promise(resolve => {
            const app = new this(effect, options);
            app.addEventListener('close', () => resolve(app.data), { once: true });
            app.render({ force: true });
        });
    }
}
