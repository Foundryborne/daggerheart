export default class DhTemplateLayer extends TemplateLayer {
    static prepareSceneControls() {
        const sc = SceneControls;
        return {
            name: 'templates',
            order: 2,
            title: 'CONTROLS.GroupMeasure',
            icon: 'fa-solid fa-ruler-combined',
            visible: game.user.can('TEMPLATE_CREATE'),
            onChange: (event, active) => {
                if (active) canvas.templates.activate();
            },
            onToolChange: () => canvas.templates.setAllRenderFlags({ refreshState: true }),
            tools: {
                circle: {
                    name: 'circle',
                    order: 1,
                    title: 'CONTROLS.MeasureCircle',
                    icon: 'fa-regular fa-circle',
                    toolclip: {
                        src: 'toolclips/tools/measure-circle.webm',
                        heading: 'CONTROLS.MeasureCircle',
                        items: sc.buildToolclipItems(['create', 'move', 'edit', 'hide', 'delete'])
                    }
                },
                cone: {
                    name: 'cone',
                    order: 2,
                    title: 'CONTROLS.inFront',
                    icon: 'fa-solid fa-eye',
                    toolclip: {
                        src: 'toolclips/tools/measure-cone.webm',
                        heading: 'CONTROLS.inFront',
                        items: sc.buildToolclipItems(['create', 'move', 'edit', 'hide', 'delete', 'rotate'])
                    }
                },
                rect: {
                    name: 'rect',
                    order: 3,
                    title: 'CONTROLS.MeasureRect',
                    icon: 'fa-regular fa-square',
                    toolclip: {
                        src: 'toolclips/tools/measure-rect.webm',
                        heading: 'CONTROLS.MeasureRect',
                        items: sc.buildToolclipItems(['create', 'move', 'edit', 'hide', 'delete', 'rotate'])
                    }
                },
                ray: {
                    name: 'ray',
                    order: 4,
                    title: 'CONTROLS.MeasureRay',
                    icon: 'fa-solid fa-up-down',
                    toolclip: {
                        src: 'toolclips/tools/measure-ray.webm',
                        heading: 'CONTROLS.MeasureRay',
                        items: sc.buildToolclipItems(['create', 'move', 'edit', 'hide', 'delete', 'rotate'])
                    }
                },
                clear: {
                    name: 'clear',
                    order: 5,
                    title: 'CONTROLS.MeasureClear',
                    icon: 'fa-solid fa-trash',
                    visible: game.user.isGM,
                    onChange: () => canvas.templates.deleteAll(),
                    button: true
                }
            },
            activeTool: 'circle'
        };
    }
}
