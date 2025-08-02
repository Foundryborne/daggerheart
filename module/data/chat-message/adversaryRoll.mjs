const fields = foundry.data.fields;

export default class DHActorRoll extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        return {
            title: new fields.StringField(),
            roll: new fields.ObjectField(),
            targets: new fields.ArrayField(
                new fields.SchemaField({
                    id: new fields.StringField({}),
                    actorId: new fields.StringField({}),
                    name: new fields.StringField({}),
                    img: new fields.StringField({}),
                    difficulty: new fields.NumberField({ integer: true, nullable: true }),
                    evasion: new fields.NumberField({ integer: true }),
                    hit: new fields.BooleanField({ initial: false }),
                    saved: new fields.SchemaField({
                        result: new fields.NumberField(),
                        success: new fields.BooleanField({ nullable: true, initial: null })
                    })
                })
            ),
            targetSelection: new fields.BooleanField({ initial: false }),
            hasRoll: new fields.BooleanField({ initial: false }),
            hasDamage: new fields.BooleanField({ initial: false }),
            hasHealing: new fields.BooleanField({ initial: false }),
            hasEffect: new fields.BooleanField({ initial: false }),
            hasSave: new fields.BooleanField({ initial: false }),
            hasTarget: new fields.BooleanField({ initial: false }),
            isCritical: new fields.BooleanField({ initial: false }),
            onSave: new fields.StringField(),
            source: new fields.SchemaField({
                actor: new fields.StringField(),
                item: new fields.StringField(),
                action: new fields.StringField()
            }),
            damage: new fields.ObjectField(),
            costs: new fields.ArrayField(
                new fields.ObjectField()
            )
        };
    }

    get messageTemplate() {
        return 'systems/daggerheart/templates/ui/chat/roll.hbs';
    }

    prepareDerivedData() {
        this.hasHitTarget = this.targets.filter(t => t.hit === true).length > 0;
        this.currentTargets =
            this.targetSelection !== true
                ? Array.from(game.user.targets).map(t =>
                      game.system.api.fields.ActionFields.TargetField.formatTarget(t)
                  )
                : this.targets;
        if(this.targetSelection === true) {
            this.targetShort = this.targets.reduce((a,c) => {
                if(c.hit) a.hit += 1;
                else c.miss += 1;
                return a;
            }, {hit: 0, miss: 0})
        }
        this.pendingSaves = this.targets.filter(
            target => target.hit && target.saved.success === null
        ).length > 0;
    }
}
