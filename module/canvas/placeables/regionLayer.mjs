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

        const shape = super._createDragShapeData(event);
        const token = shape?.type === 'emanation' && shape.base?.type === 'token' ? this.#findTokenInBounds(event.interactionData.origin) : null;
        if (token) {
            shape.base.width = token.width;
            shape.base.height = token.height;
            event.interactionData.origin = token.getCenterPoint();
        }
        return shape;
    }

    async placeRegion(data, options = {}) {
        const preConfirm = ({ _event, document, _create, _options }) => {
            const shape = document.shapes[0];
            const isEmanation = shape.type === 'emanation';
            if (isEmanation) {
                const token = this.#findTokenInBounds(shape.base.origin);
                if (!token) return options.preConfirm?.() ?? true;
                const shapeData = shape.toObject();
                document.updateSource({
                    shapes: [
                        {
                            ...shapeData,
                            base: {
                                ...shapeData.base,
                                height: token.height,
                                width: token.width,
                                x: token.x,
                                y: token.y
                            }
                        }
                    ]
                });
            }

            return options?.preConfirm?.() ?? true;
        };

        super.placeRegion(data, { ...options, preConfirm });
    }

    /** Searches for token at origin point, returning null if there are no tokens or multiple overlapping tokens */
    #findTokenInBounds(origin) {
        const { x, y } = origin;
        const gridSize = canvas.grid.size;
        const inBounds = canvas.scene.tokens.filter(t => {
            return x.between(t.x, t.x + t.width * gridSize) && y.between(t.y, t.y + t.height * gridSize);
        });
        return inBounds.length === 1 ? inBounds[0] : null;
    }
}
