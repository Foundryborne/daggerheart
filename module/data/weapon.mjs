export default class DhpWeapon extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            equipped: new fields.BooleanField({ initial: false }),
            inventoryWeapon: new fields.NumberField({ initial: null, nullable: true, integer: true }),
            secondary: new fields.BooleanField({ initial: false }),
            trait: new fields.StringField({ choices: SYSTEM.ACTOR.abilities, integer: false, initial: 'agility' }),
            range: new fields.StringField({ choices: SYSTEM.GENERAL.range, integer: false, initial: 'melee' }),
            damage: new fields.SchemaField({
                value: new fields.StringField({ initial: 'd6' }),
                type: new fields.StringField({
                    choices: SYSTEM.GENERAL.damageTypes,
                    integer: false,
                    initial: 'physical'
                })
            }),
            burden: new fields.StringField({ choices: SYSTEM.GENERAL.burden, integer: false, initial: 'oneHanded' }),
            feature: new fields.StringField({ choices: SYSTEM.ITEM.weaponFeatures, integer: false, blank: true }),
            quantity: new fields.NumberField({ initial: 1, integer: true }),
            description: new fields.HTMLField({})
        };
    }

    prepareDerivedData() {
        if (this.parent.parent) {
            this.applyEffects();
        }
    }

    applyEffects() {
        const effects = this.parent.parent.system.effects;
        for (var key in effects) {
            const effectType = effects[key];
            for (var effect of effectType) {
                switch (key) {
                    case SYSTEM.EFFECTS.effectTypes.reach.id:
                        if (
                            SYSTEM.GENERAL.range[this.range].distance <
                            SYSTEM.GENERAL.range[effect.valueData.value].distance
                        ) {
                            this.range = effect.valueData.value;
                        }

                        break;
                    // case SYSTEM.EFFECTS.effectTypes.damage.id:

                    //   if(this.damage.type === 'physical') this.damage.value = (`${this.damage.value} + ${this.parent.parent.system.levelData.currentLevel}`);
                    //   break;
                }
            }
        }
    }
}
