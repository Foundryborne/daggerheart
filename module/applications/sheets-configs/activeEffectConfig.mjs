import autocomplete from 'autocompleter';

export default class DhActiveEffectConfig extends foundry.applications.sheets.ActiveEffectConfig {
    constructor(options) {
        super(options);

        this.changeChoices = DhActiveEffectConfig.getChangeChoices();
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
            templates: ['systems/daggerheart/templates/sheets/activeEffect/change.hbs'],
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

    /**
     * Get ChangeChoices for the changes autocomplete. Static for use in this class aswell as in settings-active-effect-config.mjs
     * @returns {ChangeChoice { value: string, label: string, hint: string, group: string }[]}
     */
    static getChangeChoices() {
        const ignoredActorKeys = ['config', 'DhEnvironment', 'DhParty'];

        const getAllLeaves = (root, group, parentPath = '') => {
            const leaves = [];
            const rootKey = `${parentPath ? `${parentPath}.` : ''}${root.name}`;
            for (const field of Object.values(root.fields)) {
                if (field instanceof foundry.data.fields.SchemaField)
                    leaves.push(...getAllLeaves(field, group, rootKey));
                else
                    leaves.push({
                        value: `${rootKey}.${field.name}`,
                        label: game.i18n.localize(field.label),
                        hint: game.i18n.localize(field.hint),
                        group
                    });
            }

            return leaves;
        };
        return Object.keys(game.system.api.models.actors).reduce((acc, key) => {
            if (ignoredActorKeys.includes(key)) return acc;

            const model = game.system.api.models.actors[key];
            const group = game.i18n.localize(model.metadata.label);
            const attributes = CONFIG.Token.documentClass.getTrackedAttributes(model.metadata.type);

            const getTranslations = path => {
                if (path === 'resources.hope.max')
                    return {
                        label: game.i18n.localize('DAGGERHEART.SETTINGS.Homebrew.FIELDS.maxHope.label'),
                        hint: ''
                    };

                const field = model.schema.getField(path);
                return {
                    label: field ? game.i18n.localize(field.label) : path,
                    hint: field ? game.i18n.localize(field.hint) : ''
                };
            };

            const bars = attributes.bar.flatMap(x => {
                const joined = `${x.join('.')}.max`;
                return { value: joined, ...getTranslations(joined), group };
            });
            const values = attributes.value.flatMap(x => {
                const joined = x.join('.');
                return { value: joined, ...getTranslations(joined), group };
            });

            const bonuses = getAllLeaves(model.schema.fields.bonuses, group);
            const rules = getAllLeaves(model.schema.fields.rules, group);

            acc.push(...bars, ...values, ...rules, ...bonuses);

            return acc;
        }, []);
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

        htmlElement
            .querySelector('.stacking-change-checkbox')
            ?.addEventListener('change', this.stackingChangeToggle.bind(this));

        htmlElement
            .querySelector('.armor-change-checkbox')
            ?.addEventListener('change', this.armorChangeToggle.bind(this));

        htmlElement
            .querySelector('.armor-damage-thresholds-checkbox')
            ?.addEventListener('change', this.armorDamageThresholdToggle.bind(this));
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
            case 'settings':
                const groups = {
                    time: _loc('EFFECT.DURATION.UNITS.GROUPS.time'),
                    combat: _loc('EFFECT.DURATION.UNITS.GROUPS.combat')
                };
                partContext.durationUnits = CONST.ACTIVE_EFFECT_DURATION_UNITS.map(value => ({
                    value,
                    label: _loc(`EFFECT.DURATION.UNITS.${value}`),
                    group: CONST.ACTIVE_EFFECT_TIME_DURATION_UNITS.includes(value) ? groups.time : groups.combat
                }));
                break;
            case 'changes':
                const singleTypes = ['armor'];
                const typedChanges = context.source.changes.reduce((acc, change, index) => {
                    if (singleTypes.includes(change.type)) {
                        acc[change.type] = { ...change, index };
                    }
                    return acc;
                }, {});
                partContext.changes = partContext.changes.filter(c => !!c);
                partContext.typedChanges = typedChanges;
                break;
        }

        return partContext;
    }

    stackingChangeToggle(event) {
        const stackingFields = this.document.system.schema.fields.stacking.fields;
        const systemData = {
            stacking: event.target.checked
                ? { value: stackingFields.value.initial, max: stackingFields.max.initial }
                : null
        };
        return this.submit({ updateData: { system: systemData } });
    }

    armorChangeToggle(event) {
        if (event.target.checked) {
            this.addArmorChange();
        } else {
            this.removeTypedChange(event.target.dataset.index);
        }
    }

    /* Could be generalised if needed later */
    addArmorChange() {
        const submitData = this._processFormData(null, this.form, new FormDataExtended(this.form));
        const changes = Object.values(submitData.system?.changes ?? {});
        changes.push(game.system.api.data.activeEffects.changeTypes.armor.getInitialValue());
        return this.submit({ updateData: { system: { changes } } });
    }

    removeTypedChange(indexString) {
        const submitData = this._processFormData(null, this.form, new FormDataExtended(this.form));
        const changes = Object.values(submitData.system.changes);
        const index = Number(indexString);
        changes.splice(index, 1);
        return this.submit({ updateData: { system: { changes } } });
    }

    armorDamageThresholdToggle(event) {
        const submitData = this._processFormData(null, this.form, new FormDataExtended(this.form));
        const changes = Object.values(submitData.system?.changes ?? {});
        const index = Number(event.target.dataset.index);
        if (event.target.checked) {
            changes[index].value.damageThresholds = { major: 0, severe: 0 };
        } else {
            changes[index].value.damageThresholds = null;
        }

        return this.submit({ updateData: { system: { changes } } });
    }

    /** @inheritdoc */
    _renderChange(context) {
        const { change, index, defaultPriority } = context;
        if (!(change.type in CONFIG.DH.GENERAL.baseActiveEffectModes)) return null;

        const changeTypesSchema = this.document.system.schema.fields.changes.element.types;
        const fields = context.fields ?? (changeTypesSchema[change.type] ?? changeTypesSchema.add).fields;
        if (typeof change.value !== 'string') change.value = JSON.stringify(change.value);
        Object.assign(
            change,
            ['key', 'type', 'value', 'priority'].reduce((paths, fieldName) => {
                paths[`${fieldName}Path`] = `system.changes.${index}.${fieldName}`;
                return paths;
            }, {})
        );
        return (
            game.system.api.documents.DhActiveEffect.CHANGE_TYPES[change.type].render?.(
                change,
                index,
                defaultPriority
            ) ??
            foundry.applications.handlebars.renderTemplate(
                'systems/daggerheart/templates/sheets/activeEffect/change.hbs',
                {
                    change,
                    index,
                    defaultPriority,
                    fields,
                    types: Object.keys(CONFIG.DH.GENERAL.baseActiveEffectModes).reduce((r, key) => {
                        r[key] = CONFIG.DH.GENERAL.baseActiveEffectModes[key].label;
                        return r;
                    }, {})
                }
            )
        );
    }

    /** @inheritDoc */
    _onChangeForm(_formConfig, event) {
        if (foundry.utils.isElementInstanceOf(event.target, 'select') && event.target.name === 'system.duration.type') {
            const durationSection = this.element.querySelector('.custom-duration-section');
            if (event.target.value === 'custom') durationSection.classList.add('visible');
            else durationSection.classList.remove('visible');

            const durationDescription = this.element.querySelector('.duration-description');
            if (event.target.value === 'temporary') durationDescription.classList.add('visible');
            else durationDescription.classList.remove('visible');
        }
    }

    /** @inheritDoc */
    _processFormData(event, form, formData) {
        const submitData = super._processFormData(event, form, formData);
        if (submitData.start && !submitData.start.time) submitData.start.time = '0';
        else if (!submitData) submitData.start = null;

        return submitData;
    }

    /** @inheritDoc */
    _processSubmitData(event, form, submitData, options) {
        if (this.options.isSetting) {
            // Settings should update source instead
            this.document.updateSource(submitData);
            this.render();
        } else {
            return super._processSubmitData(event, form, submitData, options);
        }
    }

    /** Creates an active effect config for a setting */
    static async configureSetting(effect, options = {}) {
        const document = new CONFIG.ActiveEffect.documentClass({ ...foundry.utils.duplicate(effect), _id: effect.id });
        return new Promise(resolve => {
            const app = new this({ document, ...options, isSetting: true });
            app.addEventListener(
                'close',
                () => {
                    const newEffect = app.document.toObject(true);
                    newEffect.id = newEffect._id;
                    delete newEffect._id;
                    resolve(newEffect);
                },
                { once: true }
            );
            app.render({ force: true });
        });
    }
}
