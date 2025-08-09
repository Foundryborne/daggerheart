const fields = foundry.data.fields;

export default class TargetField extends fields.SchemaField {
    constructor(options = {}, context = {}) {
        const targetFields = {
            type: new fields.StringField({
                choices: CONFIG.DH.GENERAL.targetTypes,
                initial: CONFIG.DH.GENERAL.targetTypes.any.id,
                nullable: true
            }),
            amount: new fields.NumberField({ nullable: true, initial: null, integer: true, min: 0 })
        };
        super(targetFields, options, context);
    }

    static prepareConfig(config) {
        if (!this.target?.type) return [];
        config.hasTarget = true;
        let targets;
        if (this.target?.type === CONFIG.DH.GENERAL.targetTypes.self.id)
            targets = [this.actor.token ?? this.actor.prototypeToken];
        else {
            targets = Array.from(game.user.targets);
            if (this.target.type !== CONFIG.DH.GENERAL.targetTypes.any.id) {
                targets = targets.filter(t => TargetField.isTargetFriendly.call(this, t));
                if (this.target.amount && targets.length > this.target.amount) targets = [];
            }
        }
        config.targets = targets.map(t => TargetField.formatTarget.call(this, t));
        const hasTargets = TargetField.checkTargets.call(this, this.target.amount, config.targets);
        if (config.isFastForward && !hasTargets)
            return ui.notifications.warn('Too many targets selected for that actions.');
        return hasTargets;
    }

    static checkTargets(amount, targets) {
        return true;
        // return !amount || (targets.length > amount);
    }

    static isTargetFriendly(target) {
        const actorDisposition = this.actor.token
                ? this.actor.token.disposition
                : this.actor.prototypeToken.disposition,
            targetDisposition = target.document.disposition;
        return (
            (this.target.type === CONFIG.DH.GENERAL.targetTypes.friendly.id &&
                actorDisposition === targetDisposition) ||
            (this.target.type === CONFIG.DH.GENERAL.targetTypes.hostile.id &&
                actorDisposition + targetDisposition === 0)
        );
    }

    static formatTarget(actor) {
        return {
            id: actor.id,
            actorId: actor.actor.uuid,
            name: actor.actor.name,
            img: actor.actor.img,
            difficulty: actor.actor.system.difficulty,
            evasion: actor.actor.system.evasion,
            saved: {
                value: null,
                success: null
            }
        };
    }
}
