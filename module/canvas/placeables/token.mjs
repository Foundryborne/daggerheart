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
                x => x.statuses.size === 1 && x.name === game.i18n.localize(statusMap.get(x.statuses.first()).name)
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
}
