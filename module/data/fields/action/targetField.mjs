const fields = foundry.data.fields;

export default class TargetField extends fields.SchemaField {
    /** @inheritDoc */
    constructor(options = {}, context = {}) {
        const targetFields = {
            type: new fields.StringField({
                choices: CONFIG.DH.GENERAL.targetTypes,
                initial: CONFIG.DH.GENERAL.targetTypes.any.id,
                nullable: true,
                blank: true
            }),
            amount: new fields.NumberField({ nullable: true, initial: null, integer: true, min: 0 })
        };
        super(targetFields, options, context);
    }

    /**
     * Update Action Workflow config object.
     * Must be called within Action context.
     * @param {object} config    Object that contains workflow datas. Usually made from Action Fields prepareConfig methods.
     */
    prepareConfig(config) {
        if (!this.target?.type) return (config.targets = []);
        config.hasTarget = true;
        let targets;
        // If the Action is configured as self-targeted, set targets as the owner. Probably better way than to fallback to getDependentTokens
        if (this.target?.type === CONFIG.DH.GENERAL.targetTypes.self.id) {
            targets = [this.actor.token ?? this.actor.prototypeToken];
        } else if (config.targetUuid) {
            const actor = fromUuidSync(config.targetUuid);
            targets = [actor.token ?? actor.prototypeToken];
        } else {
            targets = Array.from(game.user.targets);
            if (this.target.type !== CONFIG.DH.GENERAL.targetTypes.any.id) {
                targets = targets.filter(target => TargetField.isTargetFriendly(this.actor, target, this.target.type));
                if (this.target.amount && targets.length > this.target.amount) targets = [];
            }
        }
        config.targets = targets.map(t => TargetField.formatTarget.call(this, t));
        const hasTargets = TargetField.checkTargets.call(this, this.target.amount, config.targets);
        if (config.dialog.configure === false && !hasTargets) {
            ui.notifications.warn('Too many targets selected for that actions.');
            return hasTargets;
        }
    }

    /**
     * Check if the number of selected targets respect the amount set in the Action.
     * NOT YET IMPLEMENTED. Will be with Target Picker.
     * @param {number} amount   Max amount of targets configured in the action.
     * @param {*[]} targets     Array of targeted tokens.
     * @returns {boolean}       If the amount of targeted tokens does not exceed action configured one.
     */
    static checkTargets(amount, targets) {
        return true;
        // return !amount || (targets.length > amount);
    }

    /**
     * Compare 2 Actors disposition between each other
     * @param {*} actor         First actor document.
     * @param {*} target        Second actor document.
     * @param {string} type     Disposition id to compare (friendly/hostile).
     * @returns {boolean}       If both actors respect the provided type.
     */
    static isTargetFriendly(actor, target, type) {
        const actorDisposition = actor.token ? actor.token.disposition : actor.prototypeToken.disposition,
            targetDisposition = target.document.disposition;
        return (
            (type === CONFIG.DH.GENERAL.targetTypes.friendly.id && actorDisposition === targetDisposition) ||
            (type === CONFIG.DH.GENERAL.targetTypes.hostile.id && actorDisposition + targetDisposition === 0)
        );
    }

    /**
     * Format actor to useful datas for Action roll workflow.
     * @param {*} token     Token object to format.
     * @returns {*}         Formatted Actor.
     */
    static formatTarget(token) {
        return {
            id: token.id,
            actorId: token.actor.uuid,
            name: token.name,
            img: token.actor.img,
            difficulty: token.actor.system.difficulty,
            evasion: token.actor.system.evasion,
            saved: {
                value: null,
                success: null
            }
        };
    }
}
