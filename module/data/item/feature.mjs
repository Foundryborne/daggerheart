import BaseDataItem from './base.mjs';
import { ActionField, ActionsField } from '../fields/actionField.mjs';

export default class DHFeature extends BaseDataItem {
    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Item.feature',
            type: 'feature',
            hasDescription: true,
            hasResource: true,
            hasActions: true
        });
    }

    /* -------------------------------------------- */

    /**@override */
    static DEFAULT_ICON = 'systems/daggerheart/assets/icons/documents/items/stars-stack.svg';

    /* -------------------------------------------- */

    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            originItemType: new fields.StringField({
                choices: CONFIG.DH.ITEM.featureTypes,
                nullable: true,
                initial: null
            }),
            originId: new fields.StringField({ nullable: true, initial: null }),
            identifier: new fields.StringField()
        };
    }

    get spellcastingModifier() {
        let traitValue = 0;
        if (this.actor && this.originId && ['class', 'subclass'].includes(this.originItemType)) {
            if (this.originItemType === 'subclass') {
                traitValue =
                    this.actor.system.traits[this.actor.items.get(this.originId).system.spellcastingTrait]?.value ?? 0;
            } else {
                const { value: multiclass, subclass } = this.actor.system.multiclass;
                const selectedSubclass = multiclass?.id === this.originId ? subclass : this.actor.system.class.subclass;
                traitValue = this.actor.system.traits[selectedSubclass.system.spellcastingTrait]?.value ?? 0;
            }
        }

        return traitValue;
    }
}
