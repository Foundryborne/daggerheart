const fields = foundry.data.fields;

const targetsField = () => new fields.ArrayField(
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
)

export default class DHActorRoll extends foundry.abstract.TypeDataModel {
    targetHook = null;

    static defineSchema() {
        return {
            title: new fields.StringField(),
            roll: new fields.ObjectField(),
            targets: targetsField(),
            oldTargets: targetsField(),
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

    get targetMode() {
        return this.targetSelection;
    }

    set targetMode(mode) {
        this.targetSelection = mode;
        this.updateTargets();
        this.registerTargetHook();
        this.parent.update(
            {
                system: {
                    targetSelection: this.targetSelection,
                    oldTargets: this.oldTargets
                }
            }
        );
    }

    get hitTargets() {
        return this.currentTargets.filter(t => (t.hit || !this.targetSelection));
    }

    async updateTargets() {
        this.currentTargets = this.getTargetList();
        if(!this.targetSelection && this.hasSave) {
            this.currentTargets.forEach(ct => {
                if(this.targets.find(t => t.actorId === ct.actorId)) return;
                const indexTarget = this.oldTargets.findIndex(ot => ot.actorId === ct.actorId);
                if(indexTarget === -1)
                    this.oldTargets.push(ct);
            });
            this.setPendingSaves();
            if(this.currentTargets.length) {
                if(!this.parent._id) return;
                const updates = await this.parent.update(
                    {
                        system: {
                            oldTargets: this.oldTargets
                        }
                    }
                );
                if(!updates)
                    ui.chat.updateMessage(this.parent);
            }
        }
    }

    registerTargetHook() {
        if(this.targetSelection && this.targetHook !== null) {
            Hooks.off("targetToken", this.targetHook);
            this.targetHook = null;
        } else if(!this.targetSelection && this.targetHook === null) {
            this.targetHook = Hooks.on("targetToken", foundry.utils.debounce(this.updateTargets.bind(this), 50));
        }
    }

    prepareDerivedData() {
        if(this.hasTarget) {
            this.hasHitTarget = this.targets.filter(t => t.hit === true).length > 0;
            this.updateTargets();
            this.registerTargetHook();
            if(this.targetSelection === true) {
                this.targetShort = this.targets.reduce((a,c) => {
                    if(c.hit) a.hit += 1;
                    else c.miss += 1;
                    return a;
                }, {hit: 0, miss: 0})
            }
            if(this.hasSave) this.setPendingSaves();
        }
    }

    getTargetList() {
        return this.targetSelection !== true
            ? Array.from(game.user.targets).map(t =>{
                    const target = game.system.api.fields.ActionFields.TargetField.formatTarget(t),
                        oldTarget = this.targets.find(ot => ot.actorId === target.actorId) ?? this.oldTargets.find(ot => ot.actorId === target.actorId);
                    if(oldTarget) return oldTarget;
                    return target;
                })
            : this.targets;
    }

    setPendingSaves() {
        this.pendingSaves = this.targetSelection
            ? this.targets.filter(
                target => target.hit && target.saved.success === null
            ).length > 0
            : this.currentTargets.filter(
                target => target.saved.success === null
            ).length > 0;
    }
}
