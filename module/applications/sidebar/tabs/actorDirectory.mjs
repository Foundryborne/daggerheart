export default class DhActorDirectory extends foundry.applications.sidebar.tabs.ActorDirectory {
    static DEFAULT_OPTIONS = {
        renderUpdateKeys: ['system.levelData.level.current', 'system.partner', 'system.tier']
    };

    static _entryPartial = 'systems/daggerheart/templates/ui/sidebar/actor-document-partial.hbs';

    async _prepareDirectoryContext(context, options) {
        await super._prepareDirectoryContext(context, options);
        const adversaryTypes = CONFIG.DH.ACTOR.allAdversaryTypes();
        const environmentTypes = CONFIG.DH.ACTOR.environmentTypes;
        context.getTypeLabel = document => {
            return document.type === 'adversary'
                ? game.i18n.localize(adversaryTypes[document.system.type]?.label ?? 'TYPES.Actor.adversary')
                : document.type === 'environment'
                  ? game.i18n.localize(environmentTypes[document.system.type]?.label ?? 'TYPES.Actor.environment')
                  : null;
        };
    }
}
