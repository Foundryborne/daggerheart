import { pick, sortBy } from '../../helpers/functional.mjs';

const fields = foundry.data.fields;

class DamageOverridesData extends foundry.abstract.DataModel {
    static defineSchema() {
        return {
            dice: new fields.StringField({
                choices: CONFIG.DH.GENERAL.diceTypes,
                initial: CONFIG.DH.GENERAL.diceTypes.d6,
                label: 'DAGGERHEART.GENERAL.Dice.single',
                nullable: false,
                required: true
            }),
            bonus: new fields.NumberField({ 
                nullable: false, 
                integer: true, 
                initial: 0, 
                label: 'DAGGERHEART.GENERAL.bonus'
            }),
            type: new fields.SetField(
                new fields.StringField({
                    choices: CONFIG.DH.GENERAL.damageTypes,
                    initial: 'physical',
                    nullable: false,
                    required: true
                }),
                {
                    label: 'DAGGERHEART.GENERAL.damageType'
                }
            )
        }
    }

    /** Used so that @Lookup prints human readable text */
    toString() {
        const sign = this.bonus < 0 ? '-' : '+';
        const base = this.bonus ? `${this.dice}${sign}${this.bonus}` : this.dice;
        if (this.type.size === 0) {
            return base;
        }

        const damageTypes = CONFIG.DH.GENERAL.damageTypes;
        const damageKeys = Object.keys(damageTypes);
        const typesSorted = sortBy([...this.type], t => damageKeys.indexOf(t));
        const type = typesSorted.map(t => _loc(damageTypes[t]?.abbreviation)?.toLocaleLowerCase() ?? t).join('/');
        return `${base} ${type}`;
    }
}

/** 
 * Damage overrides for the purposes of feature configuration.
 * Provides form groups for DamageOverridesData
 */
export class DamageOverridesField extends fields.EmbeddedDataField {
    constructor() {
        super(DamageOverridesData)
    }

    toFormGroup(groupConfig, inputConfig = {}) {
        const formGroups = Object.values(this.fields).map(
            f => f.toFormGroup(pick(groupConfig, ['localize']), { 
                localize: inputConfig.localize,
                name: inputConfig.name ? `${inputConfig.name}.${f.name}` : undefined,
                value: inputConfig.value && typeof inputConfig.value === 'object' ? inputConfig.value[f.name] : undefined
            })
        );
        const form = document.createElement('div');
        form.classList.add('standard-form');
        form.append(...formGroups);
        return form;
    }
}