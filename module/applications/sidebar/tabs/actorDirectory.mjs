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

    /** @inheritDoc */
    _onDragStart(event) {
        let actor;
        const { entryId } = event.currentTarget.dataset;
        if (entryId) {
            actor = this.collection.get(entryId);
            if (!actor?.visible) return false;
        }
        super._onDragStart(event);

        // Create the drag preview.
        if (actor && canvas.ready) {
            const img = event.currentTarget.querySelector('img');
            const pt = actor.prototypeToken;
            const usesSize = actor.system.metadata.usesSize;
            const tokenSizes = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).tokenSizes;
            const width = usesSize ? tokenSizes[actor.system.size] : pt.width;
            const height = usesSize ? tokenSizes[actor.system.size] : pt.height;

            const w = width * canvas.dimensions.size * Math.abs(pt.texture.scaleX) * canvas.stage.scale.x;
            const h = height * canvas.dimensions.size * Math.abs(pt.texture.scaleY) * canvas.stage.scale.y;
            const preview = foundry.applications.ux.DragDrop.implementation.createDragImage(img, w, h);
            event.dataTransfer.setDragImage(preview, w / 2, h / 2);
        }
    }
}
