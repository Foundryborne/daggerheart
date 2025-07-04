import DHBaseAction from './baseAction.mjs';

export default class DHMacroAction extends DHBaseAction {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            documentUUID: new fields.DocumentUUIDField({ type: 'Macro' })
        };
    }

    async trigger(event, ...args) {
        // const config = await super.use(event, args);
        // if (['error', 'warning'].includes(config.type)) return;
        const fixUUID = !this.documentUUID.includes('Macro.') ? `Macro.${this.documentUUID}` : this.documentUUID,
            macro = await fromUuid(fixUUID);
        try {
            if (!macro) throw new Error(`No macro found for the UUID: ${this.documentUUID}.`);
            macro.execute();
        } catch (error) {
            ui.notifications.error(error);
        }
    }
}
