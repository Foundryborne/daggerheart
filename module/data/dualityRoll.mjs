import { DualityRollColor } from './settings/Appearance.mjs';

const fields = foundry.data.fields;
const diceField = () =>
    new fields.SchemaField({
        dice: new fields.StringField({}),
        value: new fields.NumberField({ integer: true })
    });

export default class DhpDualityRoll extends foundry.abstract.TypeDataModel {
    static dualityResult = {
        hope: 1,
        fear: 2,
        critical: 3
    };

    static defineSchema() {
        return {
            title: new fields.StringField(),
            origin: new fields.StringField({ required: true }),
            roll: new fields.StringField({}),
            modifiers: new fields.ArrayField(
                new fields.SchemaField({
                    value: new fields.NumberField({ integer: true }),
                    label: new fields.StringField({}),
                    title: new fields.StringField({})
                })
            ),
            hope: diceField(),
            fear: diceField(),
            advantage: diceField(),
            disadvantage: diceField(),
            targets: new fields.ArrayField(
                new fields.SchemaField({
                    id: new fields.StringField({}),
                    name: new fields.StringField({}),
                    img: new fields.StringField({}),
                    difficulty: new fields.NumberField({ integer: true, nullable: true }),
                    evasion: new fields.NumberField({ integer: true }),
                    hit: new fields.BooleanField({ initial: false })
                })
            ),
            damage: new fields.SchemaField({
                value: new fields.StringField({}),
                type: new fields.StringField({ choices: Object.keys(SYSTEM.GENERAL.damageTypes), integer: false }),
                bonusDamage: new fields.ArrayField(
                    new fields.SchemaField({
                        value: new fields.StringField({}),
                        type: new fields.StringField({
                            choices: Object.keys(SYSTEM.GENERAL.damageTypes),
                            integer: false
                        }),
                        initiallySelected: new fields.BooleanField(),
                        appliesOn: new fields.StringField(
                            { choices: Object.keys(SYSTEM.EFFECTS.applyLocations) },
                            { nullable: true, initial: null }
                        ),
                        description: new fields.StringField({}),
                        hopeIncrease: new fields.StringField({ nullable: true })
                    }),
                    { nullable: true, initial: null }
                )
            })
        };
    }

    get total() {
        const advantage = this.advantage.value
            ? this.advantage.value
            : this.disadvantage.value
              ? -this.disadvantage.value
              : 0;
        return this.diceTotal + advantage + this.modifierTotal.value;
    }

    get diceTotal() {
        return this.hope.value + this.fear.value;
    }

    get modifierTotal() {
        const total = this.modifiers.reduce((acc, x) => acc + x.value, 0);
        return {
            value: total,
            label: total > 0 ? `+${total}` : total < 0 ? `${total}` : ''
        };
    }

    get dualityResult() {
        return this.hope.value > this.fear.value
            ? this.constructor.dualityResult.hope
            : this.fear.value > this.hope.value
              ? this.constructor.dualityResult.fear
              : this.constructor.dualityResult.critical;
    }

    get totalLabel() {
        const label =
            this.hope.value > this.fear.value
                ? 'DAGGERHEART.General.Hope'
                : this.fear.value > this.hope.value
                  ? 'DAGGERHEART.General.Fear'
                  : 'DAGGERHEART.General.CriticalSuccess';

        return game.i18n.localize(label);
    }

    get colorful() {
        return (
            game.settings.get(SYSTEM.id, SYSTEM.SETTINGS.gameSettings.appearance).dualityColorScheme ===
            DualityRollColor.colorful.value
        );
    }

    prepareDerivedData() {
        const total = this.total;

        this.hope.discarded = this.hope.value < this.fear.value;
        this.fear.discarded = this.fear.value < this.hope.value;

        this.targets.forEach(target => {
            target.hit = target.difficulty ? total >= target.difficulty : total >= target.evasion;
        });
    }
}
