export default class DHToken extends CONFIG.Token.documentClass {
    /**@inheritdoc */
    static getTrackedAttributeChoices(attributes, typeKey) {
        attributes = attributes || this.getTrackedAttributes();
        const barGroup = game.i18n.localize('TOKEN.BarAttributes');
        const valueGroup = game.i18n.localize('TOKEN.BarValues');
        const actorModel = typeKey ? game.system.api.data.actors[`Dh${typeKey.capitalize()}`] : null;
        const getLabel = path => {
            const label = actorModel?.schema.getField(path)?.label;
            return label ? game.i18n.localize(label) : path;
        };

        const bars = attributes.bar.map(v => {
            const a = v.join('.');
            return { group: barGroup, value: a, label: getLabel(a) };
        });
        bars.sort((a, b) => a.value.compare(b.value));

        const values = attributes.value.map(v => {
            const a = v.join('.');
            return { group: valueGroup, value: a, label: getLabel(a) };
        });

        values.sort((a, b) => a.value.compare(b.value));
        return bars.concat(values);
    }

    _shouldRecordMovementHistory() {
        return false;
    }

    /**@inheritdoc */
    static async createCombatants(tokens, combat) {
        combat ??= game.combats.viewed;
        if (combat?.system?.battleToggles?.length) {
            await combat.toggleModifierEffects(
                true,
                tokens.filter(x => x.actor).map(x => x.actor)
            );
        }
        super.createCombatants(tokens, combat ?? {});
    }

    /**@inheritdoc */
    static async deleteCombatants(tokens, { combat } = {}) {
        combat ??= game.combats.viewed;
        if (combat?.system?.battleToggles?.length) {
            await combat.toggleModifierEffects(
                false,
                tokens.filter(x => x.actor).map(x => x.actor)
            );
        }
        super.deleteCombatants(tokens, combat ?? {});
    }

    /**@inheritdoc */
    static async _preCreateOperation(documents, operation, user) {
        const allowed = await super._preCreateOperation(documents, operation, user);
        if (allowed === false) return false;

        const tokenSizes = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).tokenSizes;
        for (const document of documents) {
            const actor = document.actor;
            if (actor?.system.metadata.usesSize) {
                const tokenSize = tokenSizes[actor.system.size];
                if (tokenSize && actor.system.size !== CONFIG.DH.ACTOR.tokenSize.custom.id) {
                    document.updateSource({
                        width: tokenSize,
                        height: tokenSize
                    });
                }
            }
        }
    }

    /**@inheritdoc */
    _onRelatedUpdate(update = {}, operation = {}) {
        super._onRelatedUpdate(update, operation);

        if (!this.actor?.isOwner) return;

        const updates = Array.isArray(update) ? update : [update];
        const activeGM = game.users.activeGM; // Let the active GM take care of updates if available
        for (let update of updates) {
            if (
                this.actor.system.metadata.usesSize &&
                update.system?.size &&
                activeGM &&
                game.user.id === activeGM.id
            ) {
                const tokenSizes = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).tokenSizes;
                const tokenSize = tokenSizes[update.system.size];
                if (tokenSize !== this.width || tokenSize !== this.height) {
                    this.parent?.syncTokenDimensions(this, update.system.size);
                }
            }
        }
    }

    /**@inheritdoc */
    getSnappedPosition(data = {}) {
        const grid = this.parent?.grid ?? BaseScene.defaultGrid;
        const x = data.x ?? this.x;
        const y = data.y ?? this.y;
        let elevation = data.elevation ?? this.elevation;
        const unsnapped = { x, y, elevation };

        // Gridless grid
        if (grid.isGridless) return unsnapped;

        // Get position and elevation
        elevation = Math.round(elevation / grid.distance) * grid.distance;

        let width = data.width ?? this.width;
        let height = data.height ?? this.height;

        if (this.actor?.system.metadata.usesSize) {
            const tokenSizes = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Homebrew).tokenSizes;
            const tokenSize = tokenSizes[this.actor.system.size];
            if (tokenSize && this.actor.system.size !== CONFIG.DH.ACTOR.tokenSize.custom.id) {
                width = tokenSize ?? width;
                height = tokenSize ?? height;
            }
        }

        // Round width and height to nearest multiple of 0.5 if not small
        width = width < 1 ? width : Math.round(width * 2) / 2;
        height = height < 1 ? height : Math.round(height * 2) / 2;
        const shape = data.shape ?? this.shape;

        // Square grid
        let snapped;
        if (grid.isSquare) snapped = DHToken.getSnappedPositionInSquareGrid(grid, unsnapped, width, height);
        // Hexagonal grid
        else snapped = DHToken.getSnappedPositionInHexagonalGrid(grid, unsnapped, width, height, shape);
        return { x: snapped.x, y: snapped.y, elevation };
    }

    static getSnappedPositionInSquareGrid(grid, position, width, height) {
        const M = CONST.GRID_SNAPPING_MODES;
        // Small tokens snap to any vertex of the subgrid with resolution 4
        // where the token is fully contained within the grid space
        const isTiny = (width === 0.5 && height <= 1) || (width <= 1 && height === 0.5);
        if (isTiny) {
            let x = position.x / grid.size;
            let y = position.y / grid.size;
            if (width === 1) x = Math.round(x);
            else {
                x = Math.floor(x * 8);
                const k = ((x % 8) + 8) % 8;
                if (k >= 6) x = Math.ceil(x / 8);
                else if (k === 5) x = Math.floor(x / 8) + 0.5;
                else x = Math.round(x / 2) / 4;
            }
            if (height === 1) y = Math.round(y);
            else {
                y = Math.floor(y * 8);
                const k = ((y % 8) + 8) % 8;
                if (k >= 6) y = Math.ceil(y / 8);
                else if (k === 5) y = Math.floor(y / 8) + 0.5;
                else y = Math.round(y / 2) / 4;
            }

            x *= grid.size;
            y *= grid.size;

            return { x, y };
        } else if (width < 1 && height < 1) {
            // isSmall
            let xGrid = Math.round(position.x / grid.size);
            let yGrid = Math.round(position.y / grid.size);

            const x = xGrid * grid.size + grid.size / 2 - (width * grid.size) / 2;
            const y = yGrid * grid.size + grid.size / 2 - (height * grid.size) / 2;

            return { x, y };
        }

        const modeX = Number.isInteger(width) ? M.VERTEX : M.VERTEX | M.EDGE_MIDPOINT | M.CENTER;
        const modeY = Number.isInteger(height) ? M.VERTEX : M.VERTEX | M.EDGE_MIDPOINT | M.CENTER;

        if (modeX === modeY) return grid.getSnappedPoint(position, { mode: modeX });

        return {
            x: grid.getSnappedPoint(position, { mode: modeX }).x,
            y: grid.getSnappedPoint(position, { mode: modeY }).y
        };
    }

    //#region CopyPasta for mean private methods that have to be duplicated
    static getSnappedPositionInHexagonalGrid(grid, position, width, height, shape) {
        // Hexagonal shape
        const hexagonalShape = DHToken.#getHexagonalShape(width, height, shape, grid.columns);
        if (hexagonalShape) {
            const offsetX = hexagonalShape.anchor.x * grid.sizeX;
            const offsetY = hexagonalShape.anchor.y * grid.sizeY;
            position = grid.getCenterPoint({ x: position.x + offsetX, y: position.y + offsetY });
            position.x -= offsetX;
            position.y -= offsetY;
            return position;
        }

        // Rectagular shape
        const M = CONST.GRID_SNAPPING_MODES;
        return grid.getSnappedPoint(position, { mode: M.CENTER | M.VERTEX | M.CORNER | M.SIDE_MIDPOINT });
    }

    /**
     * The cache of hexagonal shapes.
     * @type {Map<string, DeepReadonly<TokenHexagonalShapeData>>}
     */
    static #hexagonalShapes = new Map();

    static #getHexagonalShape(width, height, shape, columns) {
        if (!Number.isInteger(width * 2) || !Number.isInteger(height * 2)) return null;

        // TODO: can we set a max of 2^13 on width and height so that we may use an integer key?
        const key = `${width},${height},${shape}${columns ? 'C' : 'R'}`;
        let data = DHToken.#hexagonalShapes.get(key);
        if (data) return data;

        // Hexagon symmetry
        if (columns) {
            const rowData = DHToken.#getHexagonalShape(height, width, shape, false);
            if (!rowData) return null;

            // Transpose the offsets/points of the shape in row orientation
            const offsets = { even: [], odd: [] };
            for (const { i, j } of rowData.offsets.even) offsets.even.push({ i: j, j: i });
            for (const { i, j } of rowData.offsets.odd) offsets.odd.push({ i: j, j: i });
            offsets.even.sort(({ i: i0, j: j0 }, { i: i1, j: j1 }) => j0 - j1 || i0 - i1);
            offsets.odd.sort(({ i: i0, j: j0 }, { i: i1, j: j1 }) => j0 - j1 || i0 - i1);
            const points = [];
            for (let i = rowData.points.length; i > 0; i -= 2) {
                points.push(rowData.points[i - 1], rowData.points[i - 2]);
            }
            data = {
                offsets,
                points,
                center: { x: rowData.center.y, y: rowData.center.x },
                anchor: { x: rowData.anchor.y, y: rowData.anchor.x }
            };
        }

        // Small hexagon
        else if (width === 0.5 && height === 0.5) {
            data = {
                offsets: { even: [{ i: 0, j: 0 }], odd: [{ i: 0, j: 0 }] },
                points: [0.25, 0.0, 0.5, 0.125, 0.5, 0.375, 0.25, 0.5, 0.0, 0.375, 0.0, 0.125],
                center: { x: 0.25, y: 0.25 },
                anchor: { x: 0.25, y: 0.25 }
            };
        }

        // Normal hexagon
        else if (width === 1 && height === 1) {
            data = {
                offsets: { even: [{ i: 0, j: 0 }], odd: [{ i: 0, j: 0 }] },
                points: [0.5, 0.0, 1.0, 0.25, 1, 0.75, 0.5, 1.0, 0.0, 0.75, 0.0, 0.25],
                center: { x: 0.5, y: 0.5 },
                anchor: { x: 0.5, y: 0.5 }
            };
        }

        // Hexagonal ellipse or trapezoid
        else if (shape <= CONST.TOKEN_SHAPES.TRAPEZOID_2) {
            data = DHToken.#createHexagonalEllipseOrTrapezoid(width, height, shape);
        }

        // Hexagonal rectangle
        else if (shape <= CONST.TOKEN_SHAPES.RECTANGLE_2) {
            data = DHToken.#createHexagonalRectangle(width, height, shape);
        }

        // Cache the shape
        if (data) {
            foundry.utils.deepFreeze(data);
            DHToken.#hexagonalShapes.set(key, data);
        }

        return data;
    }

    static #createHexagonalEllipseOrTrapezoid(width, height, shape) {
        if (!Number.isInteger(width) || !Number.isInteger(height)) return null;
        const points = [];
        let top;
        let bottom;
        switch (shape) {
            case CONST.TOKEN_SHAPES.ELLIPSE_1:
                if (height >= 2 * width) return null;
                top = Math.floor(height / 2);
                bottom = Math.floor((height - 1) / 2);
                break;
            case CONST.TOKEN_SHAPES.ELLIPSE_2:
                if (height >= 2 * width) return null;
                top = Math.floor((height - 1) / 2);
                bottom = Math.floor(height / 2);
                break;
            case CONST.TOKEN_SHAPES.TRAPEZOID_1:
                if (height > width) return null;
                top = height - 1;
                bottom = 0;
                break;
            case CONST.TOKEN_SHAPES.TRAPEZOID_2:
                if (height > width) return null;
                top = 0;
                bottom = height - 1;
                break;
        }
        const offsets = { even: [], odd: [] };
        for (let i = bottom; i > 0; i--) {
            for (let j = 0; j < width - i; j++) {
                offsets.even.push({ i: bottom - i, j: j + (((bottom & 1) + i + 1) >> 1) });
                offsets.odd.push({ i: bottom - i, j: j + (((bottom & 1) + i) >> 1) });
            }
        }
        for (let i = 0; i <= top; i++) {
            for (let j = 0; j < width - i; j++) {
                offsets.even.push({ i: bottom + i, j: j + (((bottom & 1) + i + 1) >> 1) });
                offsets.odd.push({ i: bottom + i, j: j + (((bottom & 1) + i) >> 1) });
            }
        }
        let x = 0.5 * bottom;
        let y = 0.25;
        for (let k = width - bottom; k--; ) {
            points.push(x, y);
            x += 0.5;
            y -= 0.25;
            points.push(x, y);
            x += 0.5;
            y += 0.25;
        }
        points.push(x, y);
        for (let k = bottom; k--; ) {
            y += 0.5;
            points.push(x, y);
            x += 0.5;
            y += 0.25;
            points.push(x, y);
        }
        y += 0.5;
        for (let k = top; k--; ) {
            points.push(x, y);
            x -= 0.5;
            y += 0.25;
            points.push(x, y);
            y += 0.5;
        }
        for (let k = width - top; k--; ) {
            points.push(x, y);
            x -= 0.5;
            y += 0.25;
            points.push(x, y);
            x -= 0.5;
            y -= 0.25;
        }
        points.push(x, y);
        for (let k = top; k--; ) {
            y -= 0.5;
            points.push(x, y);
            x -= 0.5;
            y -= 0.25;
            points.push(x, y);
        }
        y -= 0.5;
        for (let k = bottom; k--; ) {
            points.push(x, y);
            x += 0.5;
            y -= 0.25;
            points.push(x, y);
            y -= 0.5;
        }
        return {
            offsets,
            points,
            // We use the centroid of the polygon for ellipse and trapzoid shapes
            center: foundry.utils.polygonCentroid(points),
            anchor: bottom % 2 ? { x: 0.0, y: 0.5 } : { x: 0.5, y: 0.5 }
        };
    }

    /**
     * Create the row-based hexagonal rectangle given the type, width, and height.
     * @param {number} width                      The width of the Token (positive)
     * @param {number} height                     The height of the Token (positive)
     * @param {TokenShapeType} shape              The shape type (must be RECTANGLE_1 or RECTANGLE_2)
     * @returns {TokenHexagonalShapeData|null}    The hexagonal shape or null if there is no shape
     *                                            for the given combination of arguments
     */
    static #createHexagonalRectangle(width, height, shape) {
        if (width < 1 || !Number.isInteger(height)) return null;
        if (width === 1 && height > 1) return null;
        if (!Number.isInteger(width) && height === 1) return null;

        const even = shape === CONST.TOKEN_SHAPES.RECTANGLE_1 || height === 1;
        const offsets = { even: [], odd: [] };
        for (let i = 0; i < height; i++) {
            const j0 = even ? 0 : (i + 1) & 1;
            const j1 = ((width + (i & 1) * 0.5) | 0) - (even ? i & 1 : 0);
            for (let j = j0; j < j1; j++) {
                offsets.even.push({ i, j: j + (i & 1) });
                offsets.odd.push({ i, j });
            }
        }
        let x = even ? 0.0 : 0.5;
        let y = 0.25;
        const points = [x, y];
        while (x + 1 <= width) {
            x += 0.5;
            y -= 0.25;
            points.push(x, y);
            x += 0.5;
            y += 0.25;
            points.push(x, y);
        }
        if (x !== width) {
            y += 0.5;
            points.push(x, y);
            x += 0.5;
            y += 0.25;
            points.push(x, y);
        }
        while (y + 1.5 <= 0.75 * height) {
            y += 0.5;
            points.push(x, y);
            x -= 0.5;
            y += 0.25;
            points.push(x, y);
            y += 0.5;
            points.push(x, y);
            x += 0.5;
            y += 0.25;
            points.push(x, y);
        }
        if (y + 0.75 < 0.75 * height) {
            y += 0.5;
            points.push(x, y);
            x -= 0.5;
            y += 0.25;
            points.push(x, y);
        }
        y += 0.5;
        points.push(x, y);
        while (x - 1 >= 0) {
            x -= 0.5;
            y += 0.25;
            points.push(x, y);
            x -= 0.5;
            y -= 0.25;
            points.push(x, y);
        }
        if (x !== 0) {
            y -= 0.5;
            points.push(x, y);
            x -= 0.5;
            y -= 0.25;
            points.push(x, y);
        }
        while (y - 1.5 > 0) {
            y -= 0.5;
            points.push(x, y);
            x += 0.5;
            y -= 0.25;
            points.push(x, y);
            y -= 0.5;
            points.push(x, y);
            x -= 0.5;
            y -= 0.25;
            points.push(x, y);
        }
        if (y - 0.75 > 0) {
            y -= 0.5;
            points.push(x, y);
            x += 0.5;
            y -= 0.25;
            points.push(x, y);
        }
        return {
            offsets,
            points,
            // We use center of the rectangle (and not the centroid of the polygon) for the rectangle shapes
            center: {
                x: width / 2,
                y: (0.75 * Math.floor(height) + 0.5 * (height % 1) + 0.25) / 2
            },
            anchor: even ? { x: 0.5, y: 0.5 } : { x: 0.0, y: 0.5 }
        };
    }
    //#endregion

    async _preDelete() {
        if (this.actor && !this.actor.prototypeToken?.actorLink) {
            game.system.registeredTriggers.unregisterItemTriggers(this.actor.items);
        }
    }
}
