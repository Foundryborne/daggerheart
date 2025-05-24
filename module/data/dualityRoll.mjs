const fields = foundry.data.fields;
const diceField = () =>
    new fields.SchemaField({
        dice: new fields.StringField({}),
        value: new fields.NumberField({ integer: true })
    });

export default class DhpDualityRoll extends foundry.abstract.TypeDataModel {
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
        const modifiers = this.modifiers.reduce((acc, x) => acc + x.value, 0);
        const advantage = this.advantage.value
            ? this.advantage.value
            : this.disadvantage.value
              ? -this.disadvantage.value
              : 0;
        return this.highestRoll + advantage + modifiers;
    }

    get highestRoll() {
        return Math.max(this.hope.value, this.fear.value);
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

    prepareDerivedData() {
        const total = this.total;

        this.hope.discarded = this.hope.value < this.fear.value;
        this.fear.discarded = this.fear.value < this.hope.value;

        this.targets.forEach(target => {
            target.hit = target.difficulty ? total >= target.difficulty : total >= target.evasion;
        });
    }
}

//V1.3
// const fields = foundry.data.fields;
// const diceField = () => new fields.SchemaField({
//     dice: new fields.StringField({}),
//     value: new fields.NumberField({ integer: true}),
// });

// export default class DhpDualityRoll extends foundry.abstract.TypeDataModel {
//     static defineSchema() {

//       return {
//         roll: new fields.StringField({}),
//         modifiers: new fields.ArrayField(new fields.SchemaField({
//             value: new fields.NumberField({ integer: true }),
//             label: new fields.StringField({}),
//             title: new fields.StringField({}),
//         })),
//         hope: diceField(),
//         fear: diceField(),
//         advantage: diceField(),
//         disadvantage: diceField(),
//         advantageSelected: new fields.NumberField({ initial: 0 }),
//         targets: new fields.ArrayField(new fields.SchemaField({
//           id: new fields.StringField({}),
//           name: new fields.StringField({}),
//           img: new fields.StringField({}),
//           difficulty: new fields.NumberField({ integer: true, nullable: true }),
//           evasion: new fields.NumberField({ integer: true }),
//           hit: new fields.BooleanField({ initial: false }),
//         })),
//         damage: new fields.SchemaField({
//           value: new fields.StringField({}),
//           type: new fields.StringField({ choices: Object.keys(SYSTEM.GENERAL.damageTypes), integer: false }),
//           bonusDamage: new fields.ArrayField(new fields.SchemaField({
//             value: new fields.StringField({}),
//             type: new fields.StringField({ choices: Object.keys(SYSTEM.GENERAL.damageTypes), integer: false }),
//             initiallySelected: new fields.BooleanField(),
//             appliesOn: new fields.StringField({ choices: Object.keys(SYSTEM.EFFECTS.applyLocations) }, { nullable: true, initial: null }),
//             description: new fields.StringField({}),
//             hopeIncrease: new fields.StringField({ nullable: true })
//           }), { nullable: true, initial: null })
//         })
//       }
//     }

//     get total() {
//       const modifiers = this.modifiers.reduce((acc, x) => acc+x.value, 0);
//       const regular = {
//         normal: this.disadvantage.value ? Math.min(this.disadvantage.value, this.hope.value) + this.fear.value + modifiers : this.hope.value + this.fear.value + modifiers,
//         alternate: this.advantage.value ? this.advantage.value + this.fear.value + modifiers : null,
//       };

//       const advantageSolve = this.advantageSelected === 0 ? null : {
//         normal: this.advantageSelected === 1 ? this.hope.value + this.fear.value + modifiers : this.advantage.value + this.fear.value + modifiers,
//         alternate: null,
//       };

//       return advantageSolve ?? regular;
//     }

//     get totalLabel() {
//       if(this.advantage.value && this.advantageSelected === 0) return game.i18n.localize("DAGGERHEART.Chat.DualityRoll.AdvantageChooseTitle");

//       const hope = !this.advantage.value || this.advantageSelected === 1 ? this.hope.value : this.advantage.value;
//       const label = hope > this.fear.value ? "DAGGERHEART.General.Hope" : this.fear.value > hope ? "DAGGERHEART.General.Fear" : "DAGGERHEART.General.CriticalSuccess";

//       return game.i18n.localize(label);
//     }

//     get dualityDiceStates() {
//         return {
//           hope: this.hope.value > this.fear.value ? 'hope' : this.fear.value > this.hope.value ? 'fear' : 'critical',
//           alternate: this.advantage.value > this.fear.value ? 'hope' : this.fear.value > this.advantage.value ? 'fear' : 'critical',
//         }
//     }

//     prepareDerivedData(){
//       const total = this.total;
//       if(total.alternate) return false;

//       this.targets.forEach(target => {
//         target.hit = target.difficulty ? total.normal >= target.difficulty : total.normal >= target.evasion;
//       });
//     }
// }
