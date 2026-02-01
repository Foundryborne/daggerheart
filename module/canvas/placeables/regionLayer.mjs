export default class DhRegionLayer extends foundry.canvas.layers.RegionLayer {
    static prepareSceneControls() {
        const sc = foundry.applications.ui.SceneControls;
        const { tools, ...rest } = super.prepareSceneControls();

        return {
            ...rest,
            tools: {
                select: tools.select,
                templateMode: tools.templateMode,
                rectangle: tools.rectangle,
                circle: tools.circle,
                ellipse: tools.ellipse,
                cone: tools.cone,
                inFront: {
                    name: 'inFront',
                    order: 7,
                    title: 'CONTROLS.inFront',
                    icon: 'fa-solid fa-eye',
                    toolclip: {
                        src: 'toolclips/tools/measure-cone.webm',
                        heading: 'CONTROLS.inFront',
                        items: sc.buildToolclipItems(['create', 'move', 'edit', 'hide', 'delete', 'rotate'])
                    }
                },
                ring: { ...tools.ring, order: 8 },
                line: { ...tools.line, order: 9 },
                emanation: { ...tools.emanation, order: 10 },
                polygon: { ...tools.polygon, order: 11 },
                hole: { ...tools.hole, order: 12 },
                snap: { ...tools.snap, order: 13 },
                clear: { ...tools.clear, order: 14 }
            }
        };
    }

    /** @inheritDoc */
    _isCreationToolActive() {
        return this.active && (game.activeTool === 'inFront' || game.activeTool in foundry.data.BaseShapeData.TYPES);
    }

    _createDragShapeData(event) {
        const hole = ui.controls.controls[this.options.name].tools.hole?.active ?? false;
        if (game.activeTool === 'inFront') return { type: 'cone', x: 0, y: 0, radius: 0, angle: 180, hole };

        return super._createDragShapeData(event);
    }
}
