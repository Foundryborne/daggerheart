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
        }

        super.activate(element, { ...options, html: html });
    }

    _determineItemTooltipDirection(element) {
        const pos = element.getBoundingClientRect();
        const dirs = this.constructor.TOOLTIP_DIRECTIONS;
        return dirs[pos.x - this.tooltip.offsetWidth < 0 ? 'DOWN' : 'LEFT'];
    }
}
