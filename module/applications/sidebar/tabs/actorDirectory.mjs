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

    _getEntryContextOptions() {
        const options = super._getEntryContextOptions();
        options.push({
            name: 'DAGGERHEART.UI.Sidebar.actorDirectory.duplicateToNewTier',
            icon: `<i class="fa-solid fa-arrow-trend-up" inert></i>`,
            condition: li => {
                const actor = game.actors.get(li.dataset.entryId);
                return actor?.type === 'adversary' && actor.system.type !== 'social';
            },
            callback: async li => {
                const actor = game.actors.get(li.dataset.entryId);
                if (!actor) throw new Error('Unexpected missing actor');

                const tiers = [1, 2, 3, 4].filter(t => t !== actor.system.tier);
                const content = document.createElement('div');
                const select = document.createElement('select');
                select.name = 'tier';
                select.append(
                    ...tiers.map(t => {
                        const option = document.createElement('option');
                        option.value = t;
                        option.textContent = game.i18n.localize(`DAGGERHEART.GENERAL.Tiers.${t}`);
                        return option;
                    })
                );
                content.append(select);

                const tier = await foundry.applications.api.Dialog.input({
                    classes: ['dh-style', 'dialog'],
                    window: { title: 'DAGGERHEART.UI.Sidebar.actorDirectory.pickTierTitle' },
                    content,
                    ok: {
                        label: 'Create Adversary',
                        callback: (event, button, dialog) => Number(button.form.elements.tier.value)
                    }
                });

                if (tier === actor.system.tier) {
                    ui.notifications.warn('This actor is already at this tier');
                } else if (tier) {
                    const source = actor.system.adjustForTier(tier);
                    await Actor.create(source);
                    ui.notifications.info(`Tier ${tier} ${actor.name} created`);
                }
            }
        });

        return options;
    }
}
