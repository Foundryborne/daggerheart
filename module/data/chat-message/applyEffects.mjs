export default class DHApplyEffect extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;

        return {
            title: new fields.StringField(),
            targets: new fields.ArrayField(
                new fields.SchemaField({
                    id: new fields.StringField({ required: true }),
                    name: new fields.StringField(),
                    img: new fields.StringField(),
                    hit: new fields.BooleanField({ initial: false })
                })
            ),
            targetSelection: new fields.BooleanField({ initial: true }),
            source: new fields.SchemaField({
                actor: new fields.StringField(),
                item: new fields.StringField(),
                action: new fields.StringField()
            })
        };
    }

    prepareDerivedData() {
        this.hasHitTarget = this.targets.filter(t => t.hit === true).length > 0;
        this.currentTargets =
            this.targetSelection !== true
                ? Array.from(game.user.targets).map(t =>
                      game.system.api.fields.ActionFields.TargetField.formatTarget(t)
                  )
                : this.targets;
    }

    get messageTemplate() {
        return 'systems/daggerheart/templates/ui/chat/apply-effects.hbs';
    }
}
