import BaseDataItem from './base.mjs';
import ActionField from '../fields/actionField.mjs';

export default class DHDomainCard extends BaseDataItem {
    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Item.domainCard',
            type: 'domainCard',
            hasDescription: true,
            hasResource: true
        });
    }

    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            domain: new fields.StringField({
                choices: CONFIG.DH.DOMAIN.domains,
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
            actions: new fields.ArrayField(new ActionField())
        };
    }

    async _preCreate(data, options, user) {
        const allowed = await super._preCreate(data, options, user);
        if (allowed === false) return;

        if (this.actor?.type === 'character') {
            if (!this.actor.system.class.value) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.noClassSelected'));
                return false;
            }

            if (!this.actor.system.domains.find(x => x === this.domain)) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.lacksDomain'));
                return false;
            }

            if (this.actor.system.domainCards.total.find(x => x.name === this.parent.name)) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.duplicateDomainCard'));
                return false;
            }
        }
    }
}
