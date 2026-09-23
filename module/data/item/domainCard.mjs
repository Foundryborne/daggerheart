import BaseDataItem from './base.mjs';

export default class DHDomainCard extends BaseDataItem {
    static embedTemplate = 'systems/daggerheart/templates/components/card/domain.hbs';

    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Item.domainCard',
            type: 'domainCard',
            hasDescription: true,
            hasResource: true,
            hasActions: true
        });
    }

    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            domain: new fields.StringField({
                choices: CONFIG.DH.DOMAIN.allDomains,
                required: true,
                initial: CONFIG.DH.DOMAIN.domains.arcana.id
            }),
            level: new fields.NumberField({ initial: 1, integer: true }),
            recallCost: new fields.NumberField({ initial: 0, integer: true }),
            type: new fields.StringField({
                choices: CONFIG.DH.DOMAIN.cardTypes,
                required: true,
                initial: CONFIG.DH.DOMAIN.cardTypes.ability.id
            }),
            inVault: new fields.BooleanField({ initial: false }),
            vaultActive: new fields.BooleanField({
                required: true,
                nullable: false,
                initial: false
            }),
            loadoutIgnore: new fields.BooleanField({
                required: true,
                nullable: false,
                initial: false
            }),
            domainTouched: new fields.NumberField({
                nullable: true,
                initial: null
            })
        };
    }

    get domainLabel() {
        const allDomainData = CONFIG.DH.DOMAIN.allDomains();
        return game.i18n.localize(allDomainData[this.domain].label);
    }

    get isVaultSupressed() {
        return this.inVault && !this.vaultActive;
    }

    get isDomainTouchedSuppressed() {
        if (!this.parent.system.domainTouched || this.parent.parent?.type !== 'character') return false;

        const matchingDomainCards = this.parent.parent.items.filter(
            item => !item.system.inVault && item.system.domain === this.parent.system.domain
        ).length;
        return matchingDomainCards < this.parent.system.domainTouched;
    }

    /* -------------------------------------------- */

    /**@override */
    static DEFAULT_ICON = 'systems/daggerheart/assets/icons/documents/items/card-play.svg';

    /* -------------------------------------------- */

    /**@inheritdoc */
    async _preCreate(data, options, user) {
        const allowed = await super._preCreate(data, options, user);
        if (allowed === false) return;

        if (this.actor?.type === 'character') {
            const actorClasses = this.actor.items.filter(x => x.type === 'class');
            if (!actorClasses.length) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.noClassSelected'));
                return false;
            }

            if (!actorClasses.some(c => c.system.domains.find(x => x === this.domain))) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.lacksDomain'));
                return false;
            }

            if (this.actor.system.domainCards.total.find(x => x.name === this.parent.name)) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.duplicateDomainCard'));
                return false;
            }

            if (!this.actor.system.loadoutSlot.available && !this.loadoutIgnore) {
                data.system.inVault = true;
                await this.updateSource({ inVault: true });
                ui.notifications.warn(game.i18n.localize('DAGGERHEART.UI.Notifications.loadoutMaxReached'));
            }
        }
    }

    /**
     * Generates a list of localized tags based on this item's type-specific properties.
     * @returns {string[]} An array of localized tag strings.
     */
    _getTags() {
        const tags = [
            game.i18n.localize(`DAGGERHEART.CONFIG.DomainCardTypes.${this.type}`),
            this.domainLabel,
            `${game.i18n.localize('DAGGERHEART.GENERAL.levelShort')}: ${this.level}`,
            `${game.i18n.localize('DAGGERHEART.ITEMS.DomainCard.recallCost')}: ${this.recallCost}`
        ];

        return tags;
    }

    /**
     * Generate a localized label array for this item subtype.
     * @returns {(string | { value: string, icons: string[] })[]} An array of localized strings and damage label objects.
     */
    _getLabels() {
        const labels = [];

        if (this.type) labels.push(game.i18n.localize(`DAGGERHEART.CONFIG.DomainCardTypes.${this.type}`));
        if (this.domainLabel) labels.push(this.domainLabel);
        if (this.recallCost) {
            labels.push({
                value: `${this.recallCost}`, //converts the number to a string
                icons: ['fa-bolt']
            });
        }
        return labels;
    }

    /** @inheritdoc */
    async toEmbed(config = {}, options = {}) {
        // Card styling has certain defaults designed for embedding
        config.caption ??= false;
        config.cite ??= false;
        config.inline ??= true;

        const description = await this.getEnrichedDescription({ gmNotes: false, type: 'embed' }, options);
        const domains = CONFIG.DH.DOMAIN.allDomains();
        const content = await foundry.applications.handlebars.renderTemplate(this.constructor.embedTemplate, {
            item: this.parent,
            description,
            domain: foundry.utils.mergeObject({ color: 'black' }, domains[this.domain] ?? {}),
            cardType: CONFIG.DH.DOMAIN.cardTypes[this.type]
        })
        const container = document.createElement('div');
        container.innerHTML = content;
        if (['dark', 'light'].includes(config.theme)) {
            container.children[0].classList.add('themed', `theme-${config.theme}`);
        }
        return container.children;
    }

    /**
     * Switch Domain Card vault state
     * 
     * @param {Event} [event] - The triggering event passed to the action handler.
     * @param {boolean} [toVault] - The desired vault state. If omitted, toggles the current state.
     * @param {boolean} [isRecall] - True if recall cost dialog should be performed.
     * @returns {Promise<Document>} The promise resolving to the updated parent document,
     * or a warning notification result when max loadout is reached and not ignored for this domain card.
     */
    async toggleVault(event, toVault, isRecall) {
        const { available } = this.actor.system.loadoutSlot;
        toVault ??= !this.inVault;
        if (!toVault && !available && !this.loadoutIgnore) {
            return ui.notifications.warn('DAGGERHEART.UI.Notifications.loadoutMaxReached', { localize: true });
        }

        if (!toVault && isRecall && !(await this.onRecallCost(event))) {
            return;
        }

        return await this.parent.update({ 'system.inVault': toVault });
    }

    /**
     * Processes the stress cost associated with recalling an item from the vault.
     * 
     * @async
     * @param {Event} [event] - The triggering event passed to the action handler.
     * @returns {Promise<object|void>} Resolves to true if the cost is 0 or if dialog is validated, void if dialog is closed.
     */
    async onRecallCost(event) {
        if (this.recallCost == 0) {
            return true;
        }
        const type = 'effect';
        const cls = game.system.api.models.actions.actionsTypes[type];
        const action = new cls(
            {
                ...cls.getSourceConfig(this),
                type: type,
                chatDisplay: false,
                cost: [
                    {
                        key: 'stress',
                        value: this.recallCost
                    }
                ]
            },
            { parent: this }
        );
        const config = await action.use(event);
        if (config) {
            return !!(await this.toggleVault(false));
        }
    }
}
