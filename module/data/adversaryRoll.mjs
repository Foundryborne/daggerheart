export default class DhpAdversaryRoll extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            roll: new fields.StringField({}),
            total: new fields.NumberField({ integer: true }),
            modifiers: new fields.ArrayField(
                new fields.SchemaField({
                    value: new fields.NumberField({ integer: true }),
                    label: new fields.StringField({}),
                    title: new fields.StringField({})
                })
            ),
            diceResults: new fields.ArrayField(
                new fields.SchemaField({
                    value: new fields.NumberField({ integer: true }),
                    discarded: new fields.BooleanField({ initial: false })
                })
            ),
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
            damage: new fields.SchemaField(
                {
                    value: new fields.StringField({}),
                    type: new fields.StringField({ choices: Object.keys(SYSTEM.GENERAL.damageTypes), integer: false })
                },
                { nullable: true, initial: null }
            )
        };
    }

    prepareDerivedData() {
        const diceKeys = Object.keys(this.diceResults);
        const highestIndex = 0;
        for (var index in diceKeys) {
            const resultIndex = Number.parseInt(index);
            if (highestIndex === resultIndex) continue;

            const current = this.diceResults[resultIndex];
            const highest = this.diceResults[highestIndex];

            if (current.value > highest.value) this.diceResults[highestIndex].discarded = true;
            else this.diceResults[resultIndex].discarded = true;
        }

        this.targets.forEach(target => {
            target.hit = target.difficulty ? this.total >= target.difficulty : this.total >= target.evasion;
        });
    }
}
