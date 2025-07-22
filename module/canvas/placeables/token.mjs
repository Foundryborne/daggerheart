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
        const activeEffects = this.actor ? Array.from(this.actor.effects).filter(x => !x.disabled) : [];
        const overlayEffect = activeEffects.findLast(e => e.img && e.getFlag('core', 'overlay'));

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
}
