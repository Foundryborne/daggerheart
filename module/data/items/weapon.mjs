import BaseDataItem from "./base.mjs";

export default class DHWeapon extends BaseDataItem {
    /** @inheritDoc */
    static get metadata() {
        return foundry.utils.mergeObject(super.metadata, {
            label: "TYPES.Item.weapon",
            type: "weapon",
            hasDescription: true,
            isQuantifiable: true,
        });
    }

    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            equipped: new fields.BooleanField({ initial: false }),

            //TODO: NEED REVISION
            //It makes more sense to control the inventory from the actor
            inventoryWeapon: new fields.NumberField({ initial: null, nullable: true, integer: true }),

            //SETTINGS
            secondary: new fields.BooleanField({ initial: false }),
            trait: new fields.StringField({ required: true, choices: SYSTEM.ACTOR.abilities, initial: 'agility' }),
            range: new fields.StringField({ required: true, choices: SYSTEM.GENERAL.range, initial: 'melee' }),
            burden: new fields.StringField({ required: true, choices: SYSTEM.GENERAL.burden, initial: 'oneHanded' }),

            //DAMAGE
            damage: new fields.SchemaField({
                //TODO: CREATE FORMULA FIELD
                value: new fields.StringField({ initial: 'd6' }),
                type: new fields.StringField({
                    required: true,
                    choices: SYSTEM.GENERAL.damageTypes,
                    initial: 'physical'
                })
            }),

            feature: new fields.StringField({ choices: SYSTEM.ITEM.weaponFeatures, blank: true }),
        };
    }

    prepareDerivedData() {
        if (this.parent.parent) {
            this.applyEffects();
        }
    }

    applyEffects() {
        const effects = this.parent.parent.system.effects;
        for (const key in effects) {
            console.log
            const effectType = effects[key];
            for (const effect of effectType) {
                switch (key) {
                    case SYSTEM.EFFECTS.effectTypes.reach.id:
                        if (
                            SYSTEM.GENERAL.range[this.range].distance <
                            SYSTEM.GENERAL.range[effect.valueData.value].distance
                        ) {
                            this.range = effect.valueData.value;
                        }

                        break;
                }
            }
        }
    }
}
