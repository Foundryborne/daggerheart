import ItemLinkFields from '../fields/itemLinkFields.mjs';
import BaseDataItem from './base.mjs';

export default class DHSubclass extends BaseDataItem {
    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Item.subclass',
            type: 'subclass',
            hasDescription: true
        });
    }

    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            spellcastingTrait: new fields.StringField({
                choices: CONFIG.DH.ACTOR.abilities,
                integer: false,
                nullable: true,
                initial: null
            }),
            features: new ItemLinkFields(),
            featureState: new fields.NumberField({ required: true, initial: 1, min: 1 }),
            isMulticlass: new fields.BooleanField({ initial: false })
        };
    }

    get foundationFeatures() {
        return this.features.filter(x => x.type === CONFIG.DH.ITEM.featureSubTypes.foundation).map(x => x.item);
    }

    get specializationFeatures() {
        return this.features.filter(x => x.type === CONFIG.DH.ITEM.featureSubTypes.specialization).map(x => x.item);
    }

    get masteryFeatures() {
        return this.features.filter(x => x.type === CONFIG.DH.ITEM.featureSubTypes.mastery).map(x => x.item);
    }

    async _preCreate(data, options, user) {
        const allowed = await super._preCreate(data, options, user);
        if (allowed === false) return;

        if (this.actor?.type === 'character') {
            const classData = this.actor.items.find(
                x => x.type === 'class' && x.system.isMulticlass === data.system.isMulticlass
            );
            const subclassData = this.actor.items.find(
                x => x.type === 'subclass' && x.system.isMulticlass === data.system.isMulticlass
            );
            if (!classData) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.missingClass'));
                return false;
            } else if (subclassData) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.subclassAlreadySelected'));
                return false;
            } else if (classData.system.subclasses.every(x => x.uuid !== (data.uuid ?? `Item.${data._id}`))) {
                ui.notifications.error(game.i18n.localize('DAGGERHEART.UI.Notifications.subclassNotInClass'));
                return false;
            }
        }
    }

    _onCreate(data, options, userId) {
        super._onCreate(data, options, userId);

        if (userId !== game.user.id) return;

        if (options.parent?.type === 'character') {
            const path = `system.${data.system.isMulticlass ? 'multiclass.subclass' : 'class.subclass'}`;
            options.parent.update({ [path]: `${options.parent.uuid}.Item.${data._id}` });
        }
    }

    _onDelete(options, userId) {
        super._onDelete(options, userId);

        if (options.parent?.type === 'character') {
            const path = `system.${this.isMulticlass ? 'multiclass.subclass' : 'class.subclass'}`;
            options.parent.update({ [path]: null });
        }
    }
}
