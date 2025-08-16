import DHBaseAction from './baseAction.mjs';

export default class DHMacroAction extends DHBaseAction {
    static extraSchemas = [...super.extraSchemas, 'macro'];

    /* async trigger(event, ...args) {
        const fixUUID = !this.macro.includes('Macro.') ? `Macro.${this.macro}` : this.macro,
            macro = await fromUuid(fixUUID);
        try {
            if (!macro) throw new Error(`No macro found for the UUID: ${this.macro}.`);
            macro.execute();
        } catch (error) {
            ui.notifications.error(error);
        }
    } */
}
