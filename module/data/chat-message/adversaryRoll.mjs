import { DHBaseAction } from '../action/action.mjs';

const fields = foundry.data.fields;

export default class DHAdversaryRoll extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        return {
            title: new fields.StringField(),
            roll: new fields.DataField(),
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
            targetSelection: new fields.BooleanField({ initial: true }),
            hasDamage: new fields.BooleanField({ initial: false }),
            hasHealing: new fields.BooleanField({ initial: false }),
            hasEffect: new fields.BooleanField({ initial: false }),
            hasSave: new fields.BooleanField({ initial: false }),
            source: new fields.SchemaField({
                actor: new fields.StringField(),
                item: new fields.StringField(),
                action: new fields.StringField()
            }),
            damage: new fields.ObjectField()
        };
    }

    get messageTemplate() {
        return 'systems/daggerheart/templates/chat/adversary-roll.hbs';
    }

    prepareDerivedData() {
        this.hasHitTarget = this.targets.filter(t => t.hit === true).length > 0;
        this.currentTargets =
            this.targetSelection !== true
                ? Array.from(game.user.targets).map(t => DHBaseAction.formatTarget(t))
                : this.targets;
    }
}
