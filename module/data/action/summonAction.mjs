import DHBaseAction from './baseAction.mjs';

export default class DHSummonAction extends DHBaseAction {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            documentUUID: new fields.DocumentUUIDField({ type: 'Actor' })
        };
    }

    async trigger(event, ...args) {
        if (!this.canSummon || !canvas.scene) return;
        // const config = await super.use(event, args);
    }

    get canSummon() {
        return game.user.can('TOKEN_CREATE');
    }
}
