import BaseDataItem from './base.mjs';

export default class DHDomainCard extends BaseDataItem {
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
            inVault: new fields.BooleanField({ initial: false })
        };
    }

    get domainLabel() {
        const allDomainData = CONFIG.DH.DOMAIN.allDomains();
        return game.i18n.localize(allDomainData[this.domain].label);
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
}
