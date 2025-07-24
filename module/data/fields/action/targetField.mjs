const fields = foundry.data.fields;

export default class TargetField extends fields.SchemaField {
    constructor(options = {}, context = {}) {
        const targetFields = {
            type: new fields.StringField({
                choices: CONFIG.DH.ACTIONS.targetTypes,
                initial: CONFIG.DH.ACTIONS.targetTypes.any.id,
                nullable: true,
                initial: null
            }),
            amount: new fields.NumberField({ nullable: true, initial: null, integer: true, min: 0 })
        };
        super(targetFields, options, context);
    }

    static prepareConfig(config) {
        if (!this.target?.type) return [];
        let targets;
        if (this.target?.type === CONFIG.DH.ACTIONS.targetTypes.self.id)
            targets = TargetField.formatTarget.call(this, this.actor.token ?? this.actor.prototypeToken);
        targets = Array.from(game.user.targets);
        if (this.target.type !== CONFIG.DH.ACTIONS.targetTypes.any.id) {
            targets = targets.filter(t => TargetField.isTargetFriendly.call(this, t));
            if (this.target.amount && targets.length > this.target.amount) targets = [];
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
            (this.target.type === CONFIG.DH.ACTIONS.targetTypes.friendly.id &&
                actorDisposition === targetDisposition) ||
            (this.target.type === CONFIG.DH.ACTIONS.targetTypes.hostile.id &&
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
            evasion: actor.actor.system.evasion
        };
    }
}
