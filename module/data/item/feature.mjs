import BaseDataItem from './base.mjs';
import ActionField from '../fields/actionField.mjs';

export default class DHFeature extends BaseDataItem {
    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: 'TYPES.Item.feature',
            type: 'feature',
            hasDescription: true,
            hasResource: true
        });
    }

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
            subType: new fields.StringField({ choices: CONFIG.DH.ITEM.featureSubTypes, nullable: true, initial: null }),
            originId: new fields.StringField({ nullable: true, initial: null }),
            identifier: new fields.StringField(),
            actions: new fields.ArrayField(new ActionField())
        };
    }

    get spellcastingModifier() {
        let traitValue = 0;
        if (this.actor && this.originId && ['class', 'subclass'].includes(this.originItemType)) {
            if (this.originItemType === 'subclass') {
                traitValue =
                    this.actor.system.traits[this.actor.items.get(this.originId).system.spellcastingTrait]?.value ?? 0;
            } else {
                const subclass =
                    this.actor.system.multiclass.value?.id === this.originId
                        ? this.actor.system.multiclass.subclass
                        : this.actor.system.class.subclass;
                traitValue = this.actor.system.traits[subclass.system.spellcastingTrait]?.value ?? 0;
            }
        }

        return traitValue;
    }
}
