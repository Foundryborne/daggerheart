const fields = foundry.data.fields;

export default class MacroField extends fields.DocumentUUIDField {
    order = 70;

    /** @inheritDoc */
    constructor(context = {}) {
        super({ type: "Macro" }, context);
    }

    /**
     * Macro Action Workflow part.
     * @param {object} config    Object that contains workflow datas. Usually made from Action Fields prepareConfig methods. Currently not used.
     */
    async execute(config) {
        const fixUUID = !this.macro.includes('Macro.') ? `Macro.${this.macro}` : this.macro,
            macro = await fromUuid(fixUUID);
        try {
            if (!macro) throw new Error(`No macro found for the UUID: ${this.macro}.`);
            macro.execute();
        } catch (error) {
            ui.notifications.error(error);
        }
    }
}
