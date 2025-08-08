const fields = foundry.data.fields;

const targetsField = () =>
    new fields.ArrayField(
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
    );

export default class DHActorRoll extends foundry.abstract.TypeDataModel {
    targetHook = null;

    static defineSchema() {
        return {
            title: new fields.StringField(),
            roll: new fields.ObjectField(),
            targets: targetsField(),
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
            costs: new fields.ArrayField(new fields.ObjectField()),
            successConsumed: new fields.BooleanField({ initial: false })
        };
    }

    get actionActor() {
        if (!this.source.actor) return null;
        return fromUuidSync(this.source.actor);
    }

    get actionItem() {
        const actionActor = this.actionActor;
        if (!actionActor || !this.source.item) return null;
        return actionActor.items.get(this.source.item);
    }

    get action() {
        const actionItem = this.actionItem;
        if (!actionItem || !this.source.action) return null;
        return actionItem.system.actionsList?.find(a => a.id === this.source.action);
    }

    get targetMode() {
        return this.targetSelection;
    }

    set targetMode(mode) {
        this.targetSelection = mode;
        this.registerTargetHook();
        this.updateTargets();
    }

    get hitTargets() {
        return this.currentTargets.filter(t => t.hit || !this.hasRoll || !this.targetSelection);
    }

    async updateTargets() {
        if(!ui.chat.collection.get(this.parent.id)) return;
        let targets;
        if(this.targetSelection)
            targets = this.targets;
        else
            targets = Array.from(game.user.targets).map(t => game.system.api.fields.ActionFields.TargetField.formatTarget(t));
        
        this.parent.setFlag(game.system.id, "targets", targets);
        await this.parent.updateSource({
            system: {
                targetSelection: this.targetSelection
            }
        });
    }

    registerTargetHook() {
        if(!this.parent.isAuthor) return;
        if(this.targetSelection && this.targetHook !== null) {
            Hooks.off("targetToken", this.targetHook);
            this.targetHook = null;
        } else if (!this.targetSelection && this.targetHook === null) {
            this.targetHook = Hooks.on('targetToken', foundry.utils.debounce(this.updateTargets.bind(this), 50));
        }
    }

    prepareDerivedData() {
        if (this.hasTarget) {
            this.hasHitTarget = this.targets.filter(t => t.hit === true).length > 0;
            this.currentTargets = this.getTargetList();
            this. registerTargetHook();
            
            if(this.targetSelection === true && this.hasRoll) {
                this.targetShort = this.targets.reduce((a,c) => {
                    if(c.hit) a.hit += 1;
                    else a.miss += 1;
                    return a;
                }, {hit: 0, miss: 0})
            }
            if (this.hasSave) this.setPendingSaves();
        }

        this.canViewSecret = this.parent.speakerActor?.testUserPermission(game.user, 'OBSERVER');
        this.canButtonApply = game.user.isGM;
    }

    getTargetList() {
        const targets = this.targetSelection && this.parent.isAuthor ? this.targets : (this.parent.getFlag(game.system.id, "targets") ?? this.targets),
            reactionRolls = this.parent.getFlag(game.system.id, "reactionRolls");

        if(reactionRolls) {
            Object.entries(reactionRolls).forEach(([k, r]) => {
                const target = targets.find(t => t.id === k);
                if(target) target.saved  = r;
            });
        }

        return targets;
    }

    setPendingSaves() {
        this.pendingSaves = this.targetSelection
            ? this.targets.filter(target => target.hit && target.saved.success === null).length > 0
            : this.currentTargets.filter(target => target.saved.success === null).length > 0;
    }
}
