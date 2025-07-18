export default class DhTooltipManager extends foundry.helpers.interaction.TooltipManager {
    async activate(element, options = {}) {
        let html = options.html;
        if (element.dataset.tooltip?.startsWith('#item#')) {
            const splitValues = element.dataset.tooltip.slice(6).split('#action#');
            const itemUuid = splitValues[0];
            const actionId = splitValues.length > 1 ? splitValues[1] : null;

            const baseItem = await foundry.utils.fromUuid(itemUuid);
            const item = actionId ? baseItem.system.actions.find(x => x.id === actionId) : baseItem;
            if (item) {
                const type = actionId ? 'action' : item.type;
                html = await foundry.applications.handlebars.renderTemplate(
                    `systems/daggerheart/templates/ui/tooltip/${type}.hbs`,
                    {
                        item: item,
                        config: CONFIG.DH
                    }
                );

                this.tooltip.innerHTML = html;
                options.direction = this._determineItemTooltipDirection(element);
            }
        } else {
            const shortRest = element.dataset.tooltip?.startsWith('#shortRest#');
            const longRest = element.dataset.tooltip?.startsWith('#longRest#');
            if (shortRest || longRest) {
                const key = element.dataset.tooltip.slice(shortRest ? 11 : 10);
                const downtimeOptions = shortRest
                    ? CONFIG.DH.GENERAL.defaultRestOptions.shortRest()
                    : CONFIG.DH.GENERAL.defaultRestOptions.longRest();
                const move = downtimeOptions[key];
                html = await foundry.applications.handlebars.renderTemplate(
                    `systems/daggerheart/templates/ui/tooltip/downtime.hbs`,
                    {
                        move: move
                    }
                );

                this.tooltip.innerHTML = html;
                options.direction = this._determineItemTooltipDirection(
                    element,
                    this.constructor.TOOLTIP_DIRECTIONS.UP
                );
            }

            const isAdvantage = element.dataset.tooltip?.startsWith('#advantage#');
            const isDisadvantage = element.dataset.tooltip?.startsWith('#disadvantage#');
            if (isAdvantage || isDisadvantage) {
                const actorUuid = element.dataset.tooltip.slice(isAdvantage ? 11 : 14);
                const actor = await foundry.utils.fromUuid(actorUuid);

                if (actor) {
                    html = await foundry.applications.handlebars.renderTemplate(
                        `systems/daggerheart/templates/ui/tooltip/advantage.hbs`,
                        {
                            sources: isAdvantage ? actor.system.advantageSources : actor.system.disadvantageSources
                        }
                    );

                    this.tooltip.innerHTML = html;
                }
            }
        }

        super.activate(element, { ...options, html: html });
    }

    _determineItemTooltipDirection(element, prefered = this.constructor.TOOLTIP_DIRECTIONS.LEFT) {
        const pos = element.getBoundingClientRect();
        const dirs = this.constructor.TOOLTIP_DIRECTIONS;
        switch (prefered) {
            case this.constructor.TOOLTIP_DIRECTIONS.LEFT:
                return dirs[
                    pos.x - this.tooltip.offsetWidth < 0
                        ? this.constructor.TOOLTIP_DIRECTIONS.DOWN
                        : this.constructor.TOOLTIP_DIRECTIONS.LEFT
                ];
            case this.constructor.TOOLTIP_DIRECTIONS.UP:
                return dirs[
                    pos.y - this.tooltip.offsetHeight < 0
                        ? this.constructor.TOOLTIP_DIRECTIONS.RIGHT
                        : this.constructor.TOOLTIP_DIRECTIONS.UP
                ];
            case this.constructor.TOOLTIP_DIRECTIONS.RIGHT:
                return dirs[
                    pos.x + this.tooltip.offsetWidth > document.body.clientWidth
                        ? this.constructor.TOOLTIP_DIRECTIONS.DOWN
                        : this.constructor.TOOLTIP_DIRECTIONS.RIGHT
                ];
            case this.constructor.TOOLTIP_DIRECTIONS.DOWN:
                return dirs[
                    pos.y + this.tooltip.offsetHeight > document.body.clientHeight
                        ? this.constructor.TOOLTIP_DIRECTIONS.LEFT
                        : this.constructor.TOOLTIP_DIRECTIONS.DOWN
                ];
        }
    }
}
