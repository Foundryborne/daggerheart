const fields = foundry.data.fields;

export default class MacroField extends fields.DocumentUUIDField {
    static order = 100;

    constructor(context = {}) {
        super({ type: "Macro" }, context);
    }

    static async execute(config) {
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
