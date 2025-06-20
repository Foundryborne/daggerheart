export default class DhActiveEffect extends ActiveEffect {
    get isSuppressed() {
        if (['weapon', 'armor'].includes(this.parent.type)) {
            return !this.parent.system.equipped;
        }

        return super.isSuppressed;
    }

    async _preCreate(data, options, user) {
        const update = {};
        if (!data.img) {
            update.img = 'icons/magic/life/heart-cross-blue.webp';
        }

        if (Object.keys(update).length > 0) {
            await this.updateSource(update);
        }

        await super._preCreate(data, options, user);
    }

    static applyField(model, change, field) {
        change.value = Roll.safeEval(Roll.replaceFormulaData(change.value, change.effect.parent));
        super.applyField(model, change, field);
    }
}
