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
                const environments = daggerheartInfo.sceneEnvironments.filter(x => x);
                const hasEnvironments = environments.length > 0;
                return {
                    ...x,
                    hasEnvironments,
                    environmentImage: hasEnvironments ? environments[0].img : null,
                    environments: environments
                };
            });
        context.scenes.active = extendScenes(context.scenes.active);
        context.scenes.inactive = extendScenes(context.scenes.inactive);

        return context;
    }

    static async #openSceneEnvironment(event, button) {
        const scene = game.scenes.get(button.dataset.sceneId);
        const sceneEnvironments = new game.system.api.data.scenes.DHScene(scene.flags.daggerheart).sceneEnvironments;

        if (sceneEnvironments.length === 1 || event.shiftKey) {
            sceneEnvironments[0].sheet.render(true);
        } else {
            new ContextMenu(
                button,
                '.scene-environment',
                sceneEnvironments.map(environment => ({
                    name: environment.name,
                    callback: () => {
                        if (scene.flags.daggerheart.sceneEnvironments[0] !== environment.uuid) {
                            const newEnvironments = scene.flags.daggerheart.sceneEnvironments;
                            const newFirst = newEnvironments.splice(
                                newEnvironments.findIndex(x => x === environment.uuid)
                            )[0];
                            newEnvironments.unshift(newFirst);
                            scene.update({ 'flags.daggerheart.sceneEnvironments': newEnvironments });
                        }

                        environment.sheet.render({ force: true });
                    }
                })),
                {
                    jQuery: false,
                    fixed: true
                }
            );

            CONFIG.ux.ContextMenu.triggerContextMenu(event, '.scene-environment');
        }
    }
}
