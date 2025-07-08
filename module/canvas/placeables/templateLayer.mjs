export default class DhTemplateLayer extends foundry.canvas.layers.TemplateLayer {
    static prepareSceneControls() {
        const sc = foundry.applications.ui.SceneControls;
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
                    title: 'CONTROLS.MeasureCone',
                    icon: 'fa-solid fa-angle-left',
                    toolclip: {
                        src: 'toolclips/tools/measure-cone.webm',
                        heading: 'CONTROLS.MeasureCone',
                        items: sc.buildToolclipItems(['create', 'move', 'edit', 'hide', 'delete', 'rotate'])
                    }
                },
                inFront: {
                    name: 'inFront',
                    order: 3,
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
                    order: 4,
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
                    order: 5,
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
                    order: 6,
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

    _onDragLeftStart(event) {
        const interaction = event.interactionData;

        // Snap the origin to the grid
        if (!event.shiftKey) interaction.origin = this.getSnappedPoint(interaction.origin);

        // Create a pending MeasuredTemplateDocument
        const tool = game.activeTool === 'inFront' ? 'cone' : game.activeTool;
        const previewData = {
            user: game.user.id,
            t: tool,
            x: interaction.origin.x,
            y: interaction.origin.y,
            sort: Math.max(this.getMaxSort() + 1, 0),
            distance: 1,
            direction: 0,
            fillColor: game.user.color || '#FF0000',
            hidden: event.altKey
        };
        const defaults = CONFIG.MeasuredTemplate.defaults;
        if (game.activeTool === 'cone') previewData.angle = defaults.angle;
        else if (game.activeTool === 'inFront') previewData.angle = 180;
        else if (game.activeTool === 'ray') previewData.width = defaults.width * canvas.dimensions.distance;
        const cls = foundry.utils.getDocumentClass('MeasuredTemplate');
        const doc = new cls(previewData, { parent: canvas.scene });

        // Create a preview MeasuredTemplate object
        const template = new this.constructor.placeableClass(doc);
        doc._object = template;
        interaction.preview = this.preview.addChild(template);
        template.draw();
    }
}
