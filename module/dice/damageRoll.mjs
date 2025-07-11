import DamageDialog from '../applications/dialogs/damageDialog.mjs';
import DHRoll from './dhRoll.mjs';

export default class DamageRoll extends DHRoll {
    constructor(formula, data = {}, options = {}) {
        super(formula, data, options);
    }

    static messageType = 'damageRoll';

    static DefaultDialog = DamageDialog;

    static async postEvaluate(roll, config = {}) {
        super.postEvaluate(roll, config);
        config.roll.type = config.type;
        config.roll.modifierTotal = this.calculateTotalModifiers(roll);
    }

    static async buildPost(roll, config, message) {
        await super.buildPost(roll, config, message);
        if (config.source?.message) {
            const chatMessage = ui.chat.collection.get(config.source.message);
            chatMessage.update({ 'system.damage': config });
        }
    }

    constructFormula(config) {
        super.constructFormula(config);
        if (config.isCritical) {
            const tmpRoll = new Roll(this._formula)._evaluateSync({ maximize: true }),
                criticalBonus = tmpRoll.total - this.constructor.calculateTotalModifiers(tmpRoll);
            this.terms.push(...this.formatModifier(criticalBonus));
        }
        return (this._formula = this.constructor.getFormula(this.terms));
    }
}
