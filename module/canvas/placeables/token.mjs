export default class DhTokenPlaceable extends foundry.canvas.placeables.Token {
    /** @inheritDoc */
    async _drawEffects() {
        this.effects.renderable = false;

        // Clear Effects Container
        this.effects.removeChildren().forEach(c => c.destroy());
        this.effects.bg = this.effects.addChild(new PIXI.Graphics());
        this.effects.bg.zIndex = -1;
        this.effects.overlay = null;

        // Categorize effects
        const statusMap = new Map(foundry.CONFIG.statusEffects.map(status => [status.id, status]));
        const activeEffects = (this.actor ? this.actor.effects.filter(x => !x.disabled) : []).reduce((acc, effect) => {
            acc.push(effect);

            const currentStatusActiveEffects = acc.filter(
                x => x.statuses.size === 1 && x.name === game.i18n.localize(statusMap.get(x.statuses.first())?.name)
            );
            for (var status of effect.statuses) {
                if (!currentStatusActiveEffects.find(x => x.statuses.has(status))) {
                    const statusData = statusMap.get(status);
                    acc.push({
                        name: game.i18n.localize(statusData.name),
                        statuses: [status],
                        img: statusData.icon,
                        tint: effect.tint
                    });
                }
            }

            return acc;
        }, []);
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
}
