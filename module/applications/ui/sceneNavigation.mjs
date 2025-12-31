export default class DhSceneNavigation extends foundry.applications.ui.SceneNavigation {
    /** @inheritdoc */
    static DEFAULT_OPTIONS = {
        ...super.DEFAULT_OPTIONS,
        classes: ['faded-ui', 'flexcol', 'scene-navigation'],
        actions: {
            openSceneEnvironment: DhSceneNavigation.#openSceneEnvironment
        }
    };

    /** @inheritdoc */
    static PARTS = {
        scenes: {
            root: true,
            template: 'systems/daggerheart/templates/ui/sceneNavigation/scene-navigation.hbs'
        }
    };

    /** @inheritdoc */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        const extendScenes = scenes =>
            scenes.map(x => {
                const scene = game.scenes.get(x.id);
                if (!scene.flags.daggerheart) return x;

                const daggerheartInfo = new game.system.api.data.scenes.DHScene(scene.flags.daggerheart);
                const environmentKeys = Object.keys(daggerheartInfo.sceneEnvironments);
                const hasEnvironments = environmentKeys.length;
                return {
                    ...x,
                    hasEnvironments,
                    environmentImage: hasEnvironments
                        ? daggerheartInfo.sceneEnvironments[environmentKeys[0]].img
                        : null,
                    environments: daggerheartInfo.sceneEnvironments
                };
            });
        context.scenes.active = extendScenes(context.scenes.active);
        context.scenes.inactive = extendScenes(context.scenes.inactive);

        return context;
    }

    static async #openSceneEnvironment(_event, button) {
        const scene = game.scenes.get(button.dataset.sceneId);
        const sceneEnvironments = Object.keys(scene.flags.daggerheart.sceneEnvironments);
        const environment = await foundry.utils.fromUuid(
            scene.flags.daggerheart.sceneEnvironments[sceneEnvironments[0]]
        );
        environment.sheet.render(true);
    }
}
