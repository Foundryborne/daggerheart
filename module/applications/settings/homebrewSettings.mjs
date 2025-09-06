import { DhHomebrew } from '../../data/settings/_module.mjs';
import { slugify } from '../../helpers/utils.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export default class DhHomebrewSettings extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor() {
        super({});

        this.settings = new DhHomebrew(
            game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).toObject()
        );

        this.selected = this.#getDefaultAdversaryType();
    }

    #getDefaultAdversaryType = () => ({
        domain: null,
        adversaryType: null
    });

    get title() {
        return game.i18n.localize('DAGGERHEART.SETTINGS.Menu.title');
    }

    static DEFAULT_OPTIONS = {
        tag: 'form',
        id: 'daggerheart-homebrew-settings',
        classes: ['daggerheart', 'dh-style', 'dialog', 'setting', 'homebrew-settings'],
        position: { width: '600', height: 'auto' },
        window: {
            icon: 'fa-solid fa-gears'
        },
        actions: {
            addItem: this.addItem,
            editItem: this.editItem,
            removeItem: this.removeItem,
            resetMoves: this.resetMoves,
            addDomain: this.addDomain,
            toggleSelectedDomain: this.toggleSelectedDomain,
            deleteDomain: this.deleteDomain,
            addAdversaryType: this.addAdversaryType,
            deleteAdversaryType: this.deleteAdversaryType,
            selectAdversaryType: this.selectAdversaryType,
            save: this.save,
            reset: this.reset
        },
        form: { handler: this.updateData, submitOnChange: true }
    };

    static PARTS = {
        tabs: { template: 'systems/daggerheart/templates/sheets/global/tabs/tab-navigation.hbs' },
        settings: { template: 'systems/daggerheart/templates/settings/homebrew-settings/settings.hbs' },
        domains: { template: 'systems/daggerheart/templates/settings/homebrew-settings/domains.hbs' },
        types: { template: 'systems/daggerheart/templates/settings/homebrew-settings/types.hbs' },
        itemTypes: { template: 'systems/daggerheart/templates/settings/homebrew-settings/itemFeatures.hbs' },
        downtime: { template: 'systems/daggerheart/templates/settings/homebrew-settings/downtime.hbs' },
        footer: { template: 'systems/daggerheart/templates/settings/homebrew-settings/footer.hbs' }
    };

    /** @inheritdoc */
    static TABS = {
        main: {
            tabs: [{ id: 'settings' }, { id: 'domains' }, { id: 'types' }, { id: 'itemFeatures' }, { id: 'downtime' }],
            initial: 'settings',
            labelPrefix: 'DAGGERHEART.GENERAL.Tabs'
        }
    };

    changeTab(tab, group, options) {
        super.changeTab(tab, group, options);
        this.selected = this.#getDefaultAdversaryType();

        this.render();
    }

    async _prepareContext(_options) {
        const context = await super._prepareContext(_options);
        context.settingFields = this.settings;

        return context;
    }

    async _preparePartContext(partId, context) {
        await super._preparePartContext(partId, context);

        switch (partId) {
            case 'domains':
                const selectedDomain = this.selected.domain ? this.settings.domains[this.selected.domain] : null;
                const enrichedDescription = selectedDomain
                    ? await foundry.applications.ux.TextEditor.implementation.enrichHTML(selectedDomain.description)
                    : null;

                if (enrichedDescription !== null) context.selectedDomain = { ...selectedDomain, enrichedDescription };
                context.configDomains = CONFIG.DH.DOMAIN.domains;
                context.homebrewDomains = this.settings.domains;
                break;
            case 'types':
                context.selectedAdversaryType = this.selected.adversaryType
                    ? { id: this.selected.adversaryType, ...this.settings.adversaryTypes[this.selected.adversaryType] }
                    : null;
                break;
        }

        return context;
    }

    static async updateData(_event, _element, formData) {
        const updatedSettings = foundry.utils.expandObject(formData.object);

        await this.settings.updateSource({
            ...updatedSettings,
            traitArray: Object.values(updatedSettings.traitArray)
        });
        this.render();
    }

    static async addItem(_, target) {
        const { type } = target.dataset;
        if (['shortRest', 'longRest'].includes(type)) {
            await this.settings.updateSource({
                [`restMoves.${type}.moves.${foundry.utils.randomID()}`]: {
                    name: game.i18n.localize('DAGGERHEART.SETTINGS.Homebrew.newDowntimeMove'),
                    img: 'icons/magic/life/cross-worn-green.webp',
                    description: '',
                    actions: []
                }
            });
        } else if (['armorFeatures', 'weaponFeatures'].includes(type)) {
            await this.settings.updateSource({
                [`itemFeatures.${type}.${foundry.utils.randomID()}`]: {
                    name: game.i18n.localize('DAGGERHEART.SETTINGS.Homebrew.newFeature'),
                    img: 'icons/magic/life/cross-worn-green.webp',
                    description: '',
                    actions: [],
                    effects: []
                }
            });
        }

        this.render();
    }

    static async editItem(_, target) {
        const { type, id } = target.dataset;
        const isDowntime = ['shortRest', 'longRest'].includes(type);
        const path = isDowntime ? `restMoves.${type}.moves.${id}` : `itemFeatures.${type}.${id}`;
        const featureBase = isDowntime ? this.settings.restMoves[type].moves[id] : this.settings.itemFeatures[type][id];

        const editedBase = await game.system.api.applications.sheetConfigs.SettingFeatureConfig.configure(
            featureBase,
            path,
            this.settings,
            { hasIcon: isDowntime, hasEffects: !isDowntime }
        );
        if (!editedBase) return;

        await this.updateAction.bind(this)(editedBase, target.dataset.type, target.dataset.id);
    }

    async updateAction(data, type, id) {
        const isDowntime = ['shortRest', 'longRest'].includes(type);
        const path = isDowntime ? `restMoves.${type}.moves` : `itemFeatures.${type}`;
        await this.settings.updateSource({
            [`${path}.${id}`]: {
                actions: data.actions,
                name: data.name,
                icon: data.icon,
                img: data.img,
                description: data.description
            }
        });

        this.render();
    }

    static async removeItem(_, target) {
        const { type, id } = target.dataset;
        const isDowntime = ['shortRest', 'longRest'].includes(type);
        const path = isDowntime ? `restMoves.${type}.moves` : `itemFeatures.${type}`;
        await this.settings.updateSource({
            [`${path}.-=${id}`]: null
        });
        this.render();
    }

    static async resetMoves(_, target) {
        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: {
                title: game.i18n.format('DAGGERHEART.SETTINGS.Homebrew.resetMovesTitle', {
                    type: game.i18n.localize(
                        `DAGGERHEART.APPLICATIONS.Downtime.${target.dataset.type === 'shortRest' ? 'shortRest' : 'longRest'}.title`
                    )
                })
            },
            content: game.i18n.localize('DAGGERHEART.SETTINGS.Homebrew.resetMovesText')
        });

        if (!confirmed) return;

        const fields = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).schema.fields;

        const removeUpdate = Object.keys(this.settings.restMoves[target.dataset.type].moves).reduce((acc, key) => {
            acc[`-=${key}`] = null;

            return acc;
        }, {});

        const updateBase =
            target.dataset.type === 'shortRest'
                ? fields.restMoves.fields.shortRest.fields
                : fields.restMoves.fields.longRest.fields;
        const update = {
            nrChoices: updateBase.nrChoices.initial,
            moves: Object.keys(updateBase.moves.initial).reduce((acc, key) => {
                const move = updateBase.moves.initial[key];
                acc[key] = {
                    ...move,
                    name: game.i18n.localize(move.name),
                    description: game.i18n.localize(move.description),
                    actions: move.actions.reduce((acc, key) => {
                        const action = move.actions[key];
                        acc[key] = {
                            ...action,
                            name: game.i18n.localize(action.name)
                        };
                        return acc;
                    }, {})
                };

                return acc;
            }, {})
        };

        await this.settings.updateSource({
            [`restMoves.${target.dataset.type}`]: {
                ...update,
                moves: {
                    ...removeUpdate,
                    ...update.moves
                }
            }
        });

        this.render();
    }

    static async addDomain(event) {
        event.preventDefault();
        const content = new foundry.data.fields.StringField({
            label: game.i18n.localize('DAGGERHEART.SETTINGS.Homebrew.domains.newDomainInputLabel'),
            hint: game.i18n.localize('DAGGERHEART.SETTINGS.Homebrew.domains.newDomainInputHint'),
            required: true
        }).toFormGroup({}, { name: 'domainName', localize: true }).outerHTML;

        async function callback(_, button) {
            const domainName = button.form.elements.domainName.value;
            if (!domainName) return;

            const newSlug = slugify(domainName);
            const existingDomains = [
                ...Object.values(this.settings.domains),
                ...Object.values(CONFIG.DH.DOMAIN.domains)
            ];
            if (existingDomains.find(x => slugify(game.i18n.localize(x.label)) === newSlug)) {
                ui.notifications.warn(game.i18n.localize('DAGGERHEART.SETTINGS.Homebrew.domains.duplicateDomain'));
                return;
            }

            this.settings.updateSource({
                [`domains.${newSlug}`]: {
                    id: newSlug,
                    label: domainName,
                    src: 'icons/svg/portal.svg'
                }
            });

            this.selected.domain = newSlug;
            this.render();
        }

        foundry.applications.api.DialogV2.prompt({
            content: content,
            rejectClose: false,
            modal: true,
            ok: { callback: callback.bind(this) },
            window: {
                title: game.i18n.localize('DAGGERHEART.SETTINGS.Homebrew.domains.newDomainInputTitle')
            },
            position: { width: 400 }
        });
    }

    static toggleSelectedDomain(_, target) {
        this.selected.domain = this.selected.domain === target.id ? null : target.id;
        this.render();
    }

    static async deleteDomain() {
        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: {
                title: game.i18n.localize('DAGGERHEART.SETTINGS.Homebrew.domains.deleteDomain')
            },
            content: game.i18n.format('DAGGERHEART.SETTINGS.Homebrew.domains.deleteDomainText', {
                name: this.settings.domains[this.selected.domain].label
            })
        });

        if (!confirmed) return;

        await this.settings.updateSource({
            [`domains.-=${this.selected.domain}`]: null
        });

        const currentSettings = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew);
        if (currentSettings.domains[this.selected.domain]) {
            await currentSettings.updateSource({ [`domains.-=${this.selected.domain}`]: null });
            await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew, currentSettings);
        }

        const updateClasses = game.items.filter(x => x.type === 'class');
        for (let actor of game.actors) {
            updateClasses.push(...actor.items.filter(x => x.type === 'class'));
        }

        for (let c of updateClasses) {
            if (c.system.domains.includes(this.selected.domain)) {
                const newDomains =
                    c.system.domains.length === 1
                        ? [CONFIG.DH.DOMAIN.domains.arcana.id]
                        : c.system.domains.filter(x => x !== this.selected.domain);
                await c.update({ 'system.domains': newDomains });
            }
            c.sheet.render();
        }

        const updateDomainCards = game.items.filter(
            x => x.type === 'domainCard' && x.system.domain === this.selected.domain
        );
        for (let d of updateDomainCards) {
            await d.update({ 'system.domain': CONFIG.DH.DOMAIN.domains.arcana.id });
            d.sheet.render();
        }

        this.selected.domain = null;
        this.render();
    }

    static async addAdversaryType(_, target) {
        const newId = foundry.utils.randomID();
        await this.settings.updateSource({
            [`adversaryTypes.${newId}`]: {
                id: newId,
                label: game.i18n.localize('DAGGERHEART.SETTINGS.Homebrew.adversaryType.newType')
            }
        });

        this.selected.adversaryType = newId;
        this.render();
    }

    static async deleteAdversaryType(_, target) {
        const { key } = target.dataset;
        await this.settings.updateSource({ [`adversaryTypes.-=${key}`]: null });

        this.selected.adversaryType = this.selected.adversaryType === key ? null : this.selected.adversaryType;
        this.render();
    }

    static async selectAdversaryType(_, target) {
        this.selected.adversaryType = this.selected.adversaryType === target.dataset.type ? null : target.dataset.type;
        this.render();
    }

    static async save() {
        await game.settings.set(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew, this.settings.toObject());
        this.close();
    }

    static async reset() {
        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: {
                title: game.i18n.format('DAGGERHEART.SETTINGS.ResetSettings.resetConfirmationTitle')
            },
            content: game.i18n.format('DAGGERHEART.SETTINGS.ResetSettings.resetConfirmationText', {
                settings: game.i18n.localize('DAGGERHEART.SETTINGS.Menu.homebrew.name')
            })
        });
        if (!confirmed) return;

        const resetSettings = new DhHomebrew();
        let localizedSettings = this.localizeObject(resetSettings.toObject());
        this.settings.updateSource(localizedSettings);
        this.render();
    }

    localizeObject(obj) {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                if (typeof value === 'object' && value !== null) {
                    obj[key] = this.localizeObject(value);
                } else {
                    if (typeof value === 'string' && value.startsWith('DAGGERHEART.')) {
                        obj[key] = game.i18n.localize(value);
                    }
                }
            }
        }
        return obj;
    }

    _getTabs(tabs) {
        for (const v of Object.values(tabs)) {
            v.active = this.tabGroups[v.group] ? this.tabGroups[v.group] === v.id : v.active;
            v.cssClass = v.active ? 'active' : '';
        }

        return tabs;
    }
}
