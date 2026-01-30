import DhMeasuredTemplate from "./measuredTemplate.mjs";

export default class DhTokenPlaceable extends foundry.canvas.placeables.Token {
    /** @inheritdoc */
    async _draw(options) {
        await super._draw(options);

        if (this.document.flags.daggerheart?.createPlacement)
            this.previewHelp ||= this.addChild(this.#drawPreviewHelp());
    }

    /** @inheritDoc */
    async _drawEffects() {
        this.effects.renderable = false;

        // Clear Effects Container
        this.effects.removeChildren().forEach(c => c.destroy());
        this.effects.bg = this.effects.addChild(new PIXI.Graphics());
        this.effects.bg.zIndex = -1;
        this.effects.overlay = null;

        // Categorize effects
        const activeEffects = this.actor?.getActiveEffects() ?? [];
        const overlayEffect = activeEffects.findLast(e => e.img && e.getFlag?.('core', 'overlay'));

        // Draw effects
        const promises = [];
        for (const [i, effect] of activeEffects.entries()) {
            if (!effect.img) continue;
            const promise =
                effect === overlayEffect
                    ? this._drawOverlay(effect.img, effect.tint)
                    : this._drawEffect(effect.img, effect.tint);
            promises.push(
                promise.then(e => {
                    if (e) e.zIndex = i;
                })
            );
        }
        await Promise.allSettled(promises);

        this.effects.sortChildren();
        this.effects.renderable = true;
        this.renderFlags.set({ refreshEffects: true });
    }

    /**
     * Returns the distance from this token to another token object.
     * This value is corrected to handle alternate token sizes and other grid types
     * according to the diagonal rules.
     */
    distanceTo(target) {
        if (!canvas.ready) return NaN;
        if (this === target) return 0;

        const originPoint = this.center;
        const destinationPoint = target.center;

        // Compute for gridless. This version returns circular edge to edge + grid distance,
        // so that tokens that are touching return 5.
        if (canvas.grid.type === CONST.GRID_TYPES.GRIDLESS) {
            const boundsCorrection = canvas.grid.distance / canvas.grid.size;
            const originRadius = (this.bounds.width * boundsCorrection) / 2;
            const targetRadius = (target.bounds.width * boundsCorrection) / 2;
            const distance = canvas.grid.measurePath([originPoint, destinationPoint]).distance;
            return distance - originRadius - targetRadius + canvas.grid.distance;
        }

        // Compute what the closest grid space of each token is, then compute that distance
        const originEdge = this.#getEdgeBoundary(this.bounds, originPoint, destinationPoint);
        const targetEdge = this.#getEdgeBoundary(target.bounds, originPoint, destinationPoint);
        const adjustedOriginPoint = canvas.grid.getTopLeftPoint({
            x: originEdge.x + Math.sign(originPoint.x - originEdge.x),
            y: originEdge.y + Math.sign(originPoint.y - originEdge.y)
        });
        const adjustDestinationPoint = canvas.grid.getTopLeftPoint({
            x: targetEdge.x + Math.sign(destinationPoint.x - targetEdge.x),
            y: targetEdge.y + Math.sign(destinationPoint.y - targetEdge.y)
        });
        return canvas.grid.measurePath([adjustedOriginPoint, adjustDestinationPoint]).distance;
    }

    _onHoverIn(event, options) {
        super._onHoverIn(event, options);

        // Check if the setting is enabled
        const setting = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.appearance).showTokenDistance;
        if (setting === "never" || (setting === "encounters" && !game.combat?.started)) return;

        // Check if this token isn't invisible and is actually being hovered
        const isTokenValid =
            this.visible &&
            this.hover &&
            !this.isPreview &&
            !this.document.isSecret &&
            !this.controlled &&
            !this.animation;
        if (!isTokenValid) return;

        // Ensure we have a single controlled token
        const originToken = canvas.tokens.controlled[0];
        if (!originToken || canvas.tokens.controlled.length > 1) return;

        // Determine the actual range
        const ranges = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.variantRules).rangeMeasurement;
        const distanceNum = originToken.distanceTo(this);
        const distanceResult = DhMeasuredTemplate.getRangeLabels(distanceNum, ranges);
        const distanceLabel = `${distanceResult.distance} ${distanceResult.units}`.trim();

        // Create the element
        const element = document.createElement('div');
        element.id = 'token-hover-distance';
        element.classList.add('waypoint-label', 'last');
        const ruler = document.createElement('i');
        ruler.classList.add('fa-solid', 'fa-ruler');
        element.appendChild(ruler);
        const labelEl = document.createElement('span');
        labelEl.classList.add('total-measurement');
        labelEl.textContent = distanceLabel;
        element.appendChild(labelEl);

        // Position the element and add to the DOM
        const center = this.getCenterPoint();
        element.style.setProperty('--transformY', 'calc(-100% - 10px)');
        element.style.setProperty('--position-y', `${this.y}px`);
        element.style.setProperty('--position-x', `${center.x}px`);
        element.style.setProperty('--ui-scale', String(canvas.dimensions.uiScale));
        document.querySelector('#token-hover-distance')?.remove();
        document.querySelector('#measurement').appendChild(element);
    }

    _onHoverOut(...args) {
        super._onHoverOut(...args);
        document.querySelector('#token-hover-distance')?.remove();
    }

    /** Returns the point at which a line starting at origin and ending at destination intersects the edge of the bounds */
    #getEdgeBoundary(bounds, originPoint, destinationPoint) {
        const points = [
            { x: bounds.x, y: bounds.y },
            { x: bounds.x + bounds.width, y: bounds.y },
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
            { x: bounds.x, y: bounds.y + bounds.height }
        ];
        const pairsToTest = [
            [points[0], points[1]],
            [points[1], points[2]],
            [points[2], points[3]],
            [points[3], points[0]]
        ];
        for (const pair of pairsToTest) {
            const result = foundry.utils.lineSegmentIntersection(originPoint, destinationPoint, pair[0], pair[1]);
            if (result) return result;
        }

        return null;
    }

    /** Tests if the token is at least adjacent with another, with some leeway for diagonals */
    isAdjacentWith(token) {
        return this.distanceTo(token) <= canvas.grid.distance * 1.5;
    }

    /** @inheritDoc */
    _drawBar(number, bar, data) {
        const val = Number(data.value);
        const pct = Math.clamp(val, 0, data.max) / data.max;

        // Determine sizing
        const { width, height } = this.document.getSize();
        const s = canvas.dimensions.uiScale;
        const bw = width;
        const bh = 8 * (this.document.height >= 2 ? 1.5 : 1) * s;

        // Determine the color to use
        const fillColor =
            number === 0 ? foundry.utils.Color.fromRGB([1, 0, 0]) : foundry.utils.Color.fromString('#0032b1');

        // Draw the bar
        const widthUnit = bw / data.max;
        bar.clear().lineStyle(s, 0x000000, 1.0);
        const sections = [...Array(data.max).keys()];
        for (let mark of sections) {
            const x = mark * widthUnit;
            const marked = mark + 1 <= data.value;
            const color = marked ? fillColor : foundry.utils.Color.fromRGB([0, 0, 0]);
            if (mark === 0 || mark === sections.length - 1) {
                bar.beginFill(color, marked ? 1.0 : 0.5).drawRect(x, 0, widthUnit, bh, 2 * s); // Would like drawRoundedRect, but it's very troublsome with the corners. Leaving for now.
            } else {
                bar.beginFill(color, marked ? 1.0 : 0.5).drawRect(x, 0, widthUnit, bh, 2 * s);
            }
        }

        // Set position
        const posY = number === 0 ? height - bh : 0;
        bar.position.set(0, posY);
        return true;
    }

    /**
     * Draw a helptext for previews as a text object
     * @returns {PreciseText}    The Text object for the preview helper
     */
    #drawPreviewHelp() {
        const { uiScale } = canvas.dimensions;

        const textStyle = CONFIG.canvasTextStyle.clone();
        textStyle.fontSize = 18;
        textStyle.wordWrapWidth = this.w * 2.5;
        textStyle.fontStyle = 'italic';

        const helpText = new foundry.canvas.containers.PreciseText(
            `(${game.i18n.localize('DAGGERHEART.UI.Tooltip.previewTokenHelp')})`,
            textStyle
        );
        helpText.anchor.set(helpText.width / 900, 1);
        helpText.scale.set(uiScale, uiScale);
        return helpText;
    }
}
